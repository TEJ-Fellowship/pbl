import Chat from "../models/Chat.js";
import Ticket from "../models/Ticket.js";
import { hybridSearch, askGemini } from "../retriverQA/retriever.js";
import { classifyIntent, extractOrderId } from "../utils/intentClassifier.js";
import { handleToolCall } from "../mcp/server.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Health check endpoint
export const healthCheck = async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = await Chat.db.db.admin().ping();

    res.status(200).json({
      success: true,
      message: "Server is running",
      timestamp: new Date().toISOString(),
      database: dbStatus.ok ? "connected" : "disconnected",
      environment: process.env.NODE_ENV || "development",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server is running but database is not connected",
      error: err.message,
    });
  }
};

// Auto-detect language from text
function detectLanguage(text) {
  if (!text || typeof text !== "string") return "en";

  // Check for Devanagari script (Nepali)
  const nepaliChars = text.match(/[\u0900-\u097F]/g);
  if (nepaliChars && nepaliChars.length > 5) return "np";

  // Check for Nepali romanized keywords
  const nepaliKeywords = [
    "kaha",
    "kasari",
    "kata",
    "kati",
    "kun",
    "mero",
    "tapai",
    "hamilai",
    "chha",
    "chhaina",
    "garna",
    "garnu",
  ];
  const lowerText = text.toLowerCase();
  const hasNepaliKeywords = nepaliKeywords.some((kw) => lowerText.includes(kw));
  if (hasNepaliKeywords) return "np";

  return "en";
}

// Check urgency and create escalation ticket if needed
async function checkUrgencyAndEscalate(
  order,
  intent,
  question,
  language,
  orderId
) {
  if (!order) return null;

  const createdAt = new Date(order.createdAt || order.orderPlacedAt);
  const now = new Date();
  const elapsedMinutes = Math.floor((now - createdAt) / 60000);
  const promisedMinutes = order.promisedMinutes || 60;
  const delayMinutes = Math.max(0, elapsedMinutes - promisedMinutes);

  // Escalate if order is >90 minutes late
  if (delayMinutes >= 90 && order.status !== "delivered") {
    console.log(`🚨 URGENT: Order ${orderId} is ${delayMinutes} minutes late!`);

    // Determine ticket type based on intent
    let ticketType = "delivery_delay";
    if (intent.intent === "payment_issue") ticketType = "payment_issue";
    else if (intent.intent === "refund_request") ticketType = "refund_request";
    else if (intent.intent === "delivery_problem")
      ticketType = "delivery_delay";

    // Create escalation ticket
    const ticket = new Ticket({
      orderId: orderId,
      type: ticketType,
      priority: "urgent",
      status: "open",
      customerQuestion: question,
      urgencyReason: `Order is ${delayMinutes} minutes late (promised: ${promisedMinutes} min)`,
      delayMinutes: delayMinutes,
      language: language,
      metadata: {
        customerPhone: order.customer?.phone,
        restaurantName: order.restaurant?.name || order.restaurantName,
        orderTotal: order.total,
        paymentMethod: order.paymentMethod,
        eta: order.currentETA || order.eta,
        currentStage: order.currentStage,
      },
    });

    await ticket.save();
    console.log(`✅ Created escalation ticket: ${ticket.ticketId}`);

    return ticket;
  }

  // Also escalate for urgent payment/refund issues regardless of delay
  if (
    (intent.intent === "payment_issue" || intent.intent === "refund_request") &&
    order
  ) {
    console.log(`🚨 Escalating ${intent.intent} for order ${orderId}`);

    const ticket = new Ticket({
      orderId: orderId,
      type:
        intent.intent === "payment_issue" ? "payment_issue" : "refund_request",
      priority: "high",
      status: "open",
      customerQuestion: question,
      urgencyReason: `Customer reported ${intent.intent}`,
      language: language,
      metadata: {
        customerPhone: order.customer?.phone,
        restaurantName: order.restaurant?.name || order.restaurantName,
        orderTotal: order.total,
        paymentMethod: order.paymentMethod,
      },
    });

    await ticket.save();
    console.log(`✅ Created escalation ticket: ${ticket.ticketId}`);

    return ticket;
  }

  return null;
}

// Handle chat request with RAG + MCP integration
export const handleChat = async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      question,
      language: userLanguage,
      userLat = null,
      userLng = null,
      sessionId = null,
    } = req.body;

    // Auto-detect language if not provided
    const language = userLanguage?.trim() || detectLanguage(question);

    console.log(
      `📝 New question: "${question}" (Language: ${language}${
        !userLanguage ? " [auto-detected]" : ""
      }${sessionId ? ` [Session: ${sessionId.substring(0, 8)}...]` : ""})`
    );

    // Step 0: Fetch conversational context if sessionId exists
    let conversationContext = [];
    if (sessionId) {
      const recentChats = await Chat.find({ sessionId })
        .sort({ createdAt: -1 })
        .limit(3) // Reduced from 5 to 3 for faster context loading
        .select("question answer intent orderId")
        .lean(); // Use lean() for faster queries (plain JS objects)
      conversationContext = recentChats.reverse();
      if (conversationContext.length > 0) {
        console.log(`💭 Found ${conversationContext.length} previous messages in session`);
      }
    }

    // Step 1: Classify intent
    const intent = classifyIntent(question);
    console.log(
      `🎯 Intent: ${intent.intent} (confidence: ${intent.confidence})`
    );

    let answer = "";
    let mcpResult = null;
    let shouldUseRAG = true;
    let topSections = []; // Initialize outside the scope

    // Step 2: Handle MCP tool intents
    // Lower threshold to 0.65 to catch more intent variations
    if (intent.tool && intent.confidence > 0.65) {
      const orderId = intent.orderId || extractOrderId(question);

      // Determine if this tool needs order ID or can run without it
      const toolsNeedOrderId = [
        "get_all_details",
        "get_order_status",
        "get_location_tracking",
        "calculate_eta",
        "get_order_details",
        "get_driver_info",
        "get_progress_tracking",
        "get_route_info",
      ];
      const needsOrderId = toolsNeedOrderId.includes(intent.tool);

      if (needsOrderId && !orderId) {
        // Intent detected but order ID missing
        answer =
          language === "np"
            ? "कृपया आफ्नो अर्डर आइडी प्रदान गर्नुहोस् (उदाहरण: FM100001) ताकि म तपाईंको अर्डर ट्र्याक गर्न सकूँ।"
            : "Please provide your Order ID (e.g., FM100001) so I can track your order for you.";
        shouldUseRAG = false;
      } else if (!needsOrderId || (needsOrderId && orderId)) {
        // Tool can run without order ID, or has order ID
        console.log(`🔧 Using MCP tool: ${intent.tool}${orderId ? ` for order: ${orderId}` : ""}`);

        try {
          // Call appropriate MCP tool with context-specific args
          const toolArgs = {};
          
          // Add order-specific args if order ID present
          if (orderId) {
            toolArgs.orderId = orderId;
            toolArgs.userLat = userLat || null;
            toolArgs.userLng = userLng || null;
          }
          
          // Add restaurant search specific args if present
          if (intent.restaurantName) {
            toolArgs.restaurantName = intent.restaurantName;
          }
          if (intent.queryType) {
            toolArgs.query = intent.queryType;
          }
          
          // Add festival/region specific args if present
          if (intent.festival) {
            toolArgs.festival = intent.festival;
          }
          if (intent.region) {
            toolArgs.region = intent.region;
          }
          if (intent.mealType) {
            toolArgs.mealType = intent.mealType;
          }
          
          // Add location for weather/address tools
          if (intent.tool === "check_weather_delay" || intent.tool === "validate_address" || intent.tool === "get_current_weather") {
            if (userLat && userLng) {
              // Pass coordinates as a location string - tools will handle geocoding
              toolArgs.location = `${userLat},${userLng}`;
            } else {
              toolArgs.location = "Kathmandu";
            }
          }

          mcpResult = await handleToolCall(intent.tool, toolArgs);

          if (mcpResult && mcpResult.success) {
            // Format MCP result into natural language response
            // For get_all_details, pass the entire mcpResult structure
            const dataToFormat =
              intent.tool === "get_all_details" ? mcpResult : mcpResult.data;
            answer = formatMCPResult(intent.tool, dataToFormat, language);
            shouldUseRAG = false; // Don't use RAG if MCP tool succeeded

            console.log(`✅ MCP tool result: Success`);
          } else {
            console.log(
              `⚠️ MCP tool returned no data, error:`,
              mcpResult?.error
            );
            // If MCP failed, provide helpful error message instead of falling to RAG
            if (mcpResult && mcpResult.error) {
              answer =
                language === "np"
                  ? `जानकारी भेटिएन: ${mcpResult.error}। कृपया पछि प्रयास गर्नुहोस्।`
                  : `Information not found: ${mcpResult.error}. Please try again later.`;
              shouldUseRAG = false;
            } else {
              shouldUseRAG = true;
            }
          }
        } catch (mcpError) {
          console.error(`❌ MCP tool error:`, mcpError.message);
          console.error(`Stack:`, mcpError.stack);
          // Provide helpful error message
          answer =
            language === "np"
              ? `सेवा अस्थायी रूपमा अनुपलब्ध छ। कृपया पछि प्रयास गर्नुहोस्।`
              : `Service temporarily unavailable. Please try again later.`;
          shouldUseRAG = false;
        }
      }
    }

    // Step 3: Use RAG if no MCP tool was used or failed
    if (shouldUseRAG) {
      console.log("🔍 Searching for relevant context with hybrid search...");

      try {
        // Optimize: reduce topK from 5 to 3 for faster retrieval
        topSections = await hybridSearch(question, 3);

        if (topSections.length === 0) {
          console.warn(
            "⚠️ No relevant context found - Pinecone index might be empty"
          );
        } else {
          console.log(`✅ Found ${topSections.length} relevant sections`);
        }
      } catch (retrievalError) {
        console.error(`❌ Retrieval error:`, retrievalError.message);
        // If Pinecone fails, provide a helpful message
        topSections = [];
      }

      // Generate answer using Gemini with RAG context
      console.log("🤖 Generating answer with Gemini (RAG)...");

      // Include MCP context and conversational context if available
      let ragQuestion = question;
      if (mcpResult && mcpResult.success && shouldUseRAG) {
        ragQuestion = `${question}\n\nNote: Order data is available if needed.`;
      }
      
      // Add conversational context to prompt
      let contextualQuestion = ragQuestion;
      if (conversationContext.length > 0) {
        const contextString = conversationContext.map((chat, idx) => {
          return `Q${idx + 1}: ${chat.question}\nA${idx + 1}: ${chat.answer.substring(0, 100)}...`; // Reduced for faster processing
        }).join('\n\n');
        contextualQuestion = `Previous conversation context:\n${contextString}\n\nCurrent question: ${ragQuestion}`;
      }

      try {
        answer = await askGemini(contextualQuestion, topSections, language);
      } catch (ragError) {
        console.error(`❌ RAG generation error:`, ragError.message);
        
        // RAG failed, try general knowledge as fallback
        console.log("🔍 Trying general knowledge search as fallback...");
        try {
          answer = await askGemini(question, [], language);
          console.log("✅ General knowledge search succeeded");
        } catch (webError) {
          console.error(`❌ General knowledge search failed:`, webError.message);
          answer =
            language === "np"
              ? "माफ गर्नुहोस्, म तपाईंको प्रश्नको जवाफ दिन असमर्थ भएँ। कृपया पछि प्रयास गर्नुहोस्।"
              : "Sorry, I couldn't generate an answer. Please try again.";
        }
      }
    }

    // Step 4: Check urgency and escalate if needed
    let escalationTicket = null;
    if (mcpResult?.success && (intent.orderId || extractOrderId(question))) {
      const orderId = intent.orderId || extractOrderId(question);
      const orders = loadOrders();
      const order = orders.find(
        (o) => o.orderId === orderId || o.orderNumber === orderId
      );

      if (order) {
        escalationTicket = await checkUrgencyAndEscalate(
          order,
          intent,
          question,
          language,
          orderId
        );

        // Add escalation message to answer if ticket was created
        if (escalationTicket) {
          const escalationMsg =
            language === "np"
              ? `\n\n⚠️ तपाईंको अर्डर ढिलाइ भएकोले, हामीले तपाईंको मुद्दालाई प्राथमिकता दिएका छौं। सपोर्ट टिकट नम्बर: ${escalationTicket.ticketId}। हाम्रो टोली चाँडै सम्पर्कमा आउनेछ।`
              : `\n\n⚠️ Due to the delay in your order, we've escalated your issue to our support team. Ticket number: ${escalationTicket.ticketId}. Our team will contact you shortly.`;
          answer += escalationMsg;
        }
      }
    }

    // Step 5: Save chat to DB with analytics
    if (!answer) {
      answer =
        language === "np"
          ? "माफ गर्नुहोस्, म तपाईंको प्रश्नको जवाफ दिन असमर्थ भएँ।"
          : "Sorry, I couldn't process your question. Please try again.";
    }

    const duration = Date.now() - startTime;
    const chatData = {
      question,
      answer,
      language,
      intent: intent.intent,
      mcpTool: intent.tool || null,
      orderId: intent.orderId || extractOrderId(question) || null,
      latencyMs: duration,
      method: mcpResult?.success ? "MCP" : "RAG",
      wasEscalated: !!escalationTicket,
      ticketId: escalationTicket?.ticketId || null,
    };
    
    // Add sessionId for conversational memory
    if (sessionId) {
      chatData.sessionId = sessionId;
    }
    
    // Only add userLocation if both lat and lng are present
    if (userLat && userLng) {
      chatData.userLocation = { lat: userLat, lng: userLng };
    }
    
    const newChat = new Chat(chatData);
    const chatDocId = newChat._id; // Store ID before async save
    
    // Save chat asynchronously (non-blocking) for better performance
    newChat.save().then(() => {
      console.log(`💾 Chat saved to database (ID: ${chatDocId})`);
    }).catch(err => {
      console.error(`⚠️ Failed to save chat:`, err.message);
    });
    
    console.log(`✅ Request completed in ${duration}ms`);

    res.status(200).json({
      success: true,
      answer: answer,
      data: {
        question,
        answer,
        chatId: chatDocId,
        timestamp: new Date().toISOString(),
        language,
        intent: intent.intent,
        mcpTool: intent.tool || null,
        mcpResult: mcpResult?.success
          ? {
              tool: intent.tool,
              orderId: intent.orderId || extractOrderId(question),
              hasData: true,
            }
          : null,
      },
      meta: {
        sectionsFound: shouldUseRAG ? topSections?.length || 0 : 0,
        processingTime: `${duration}ms`,
        method: mcpResult?.success ? "MCP" : "RAG",
      },
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error after ${duration}ms:`, err.message);
    console.error(err.stack);

    res.status(500).json({
      success: false,
      error: "Failed to process your question. Please try again.",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Format MCP tool result into natural language
function formatMCPResult(toolName, data, language = "en") {
  if (!data) {
    return language === "np"
      ? "जानकारी उपलब्ध छैन।"
      : "No information available.";
  }

  const isNepali = language === "np";

  switch (toolName) {
    case "get_all_details": {
      // Handle comprehensive tracking data (from get_all_details tool)
      // Data structure: { success: true, status: {...}, location: {...}, etc. }
      const statusData = data.status?.data || data.status || {};
      const etaData = data.eta?.data || data.eta || {};
      const locationData = data.location?.data || data.location || {};
      const driverData =
        data.driver?.driver || data.driver?.data?.driver || data.driver || {};
      const progressData = data.progress?.data || data.progress || {};

      const orderNum = statusData.orderNumber || data.orderId || "";
      const orderStatus =
        statusData.status || statusData.rawStatus || "Unknown";
      const comprehensiveEta = etaData.eta || etaData.data?.eta || 0;
      const comprehensiveDriverName = driverData.name || "Not assigned";
      const currentStage =
        progressData.currentStage ?? statusData.currentStage ?? 0;

      let response = isNepali
        ? `अर्डर ${orderNum} को स्थिति: ${orderStatus}।`
        : `Order ${orderNum} status: ${orderStatus}.`;

      if (comprehensiveEta > 0) {
        response += isNepali
          ? ` अनुमानित समय: ${comprehensiveEta} मिनेट।`
          : ` Estimated arrival: ${comprehensiveEta} minutes.`;
      }

      if (
        comprehensiveDriverName &&
        comprehensiveDriverName !== "Not assigned"
      ) {
        response += isNepali
          ? ` ड्राइभर: ${comprehensiveDriverName}।`
          : ` Driver: ${comprehensiveDriverName}.`;
      }

      return response;
    }

    case "get_order_status": {
      const status = data.status || data.data?.status || "Unknown";
      const orderNumber = data.orderNumber || data.data?.orderNumber || "";
      return isNepali
        ? `अर्डर ${orderNumber} को स्थिति: ${status}।`
        : `Order ${orderNumber} status: ${status}.`;
    }

    case "get_driver_info": {
      const driver = data.driver || data.data?.driver || {};
      const driverName = driver.name || "Not assigned";
      const driverPhone = driver.phone || "";
      return isNepali
        ? `ड्राइभर: ${driverName}${driverPhone ? ` (${driverPhone})` : ""}।`
        : `Driver: ${driverName}${driverPhone ? ` (${driverPhone})` : ""}.`;
    }

    case "calculate_eta": {
      const eta = data.eta || data.data?.eta || 0;
      return isNepali
        ? `अनुमानित आगमन समय: ${eta} मिनेट।`
        : `Estimated time of arrival: ${eta} minutes.`;
    }

    case "get_location_tracking": {
      const location = data.deliveryPerson || data.data?.deliveryPerson;
      if (location && location.lat && location.lng) {
        return isNepali
          ? `डेलिभरी व्यक्ति स्थान: ${location.lat.toFixed(
              4
            )}, ${location.lng.toFixed(4)}।`
          : `Delivery person location: ${location.lat.toFixed(
              4
            )}, ${location.lng.toFixed(4)}.`;
      }
      return isNepali
        ? "डेलिभरी व्यक्ति अझै असाइन भएको छैन।"
        : "Delivery person has not been assigned yet.";
    }

    case "get_progress_tracking": {
      const progress = data.progress || data.data?.progress || {};
      const steps = progress.steps || [];
      const currentStep =
        steps.find((s) => !s.completed) || steps[steps.length - 1];
      return isNepali
        ? `हालको चरण: ${currentStep?.name || "Unknown"}।`
        : `Current stage: ${currentStep?.name || "Unknown"}.`;
    }

    case "check_festival_schedule": {
      const festival = data.festival || data.data?.festival;
      const orderVolume = data.orderVolume || data.data?.orderVolume || {};
      const recommendation =
        data.recommendation || data.data?.recommendation || "";

      if (festival) {
        return isNepali
          ? `${festival.nepaliName || festival.name} आजको दिन हो! अपेक्षित अर्डर: ${orderVolume.multiplier}x सामान्य। ${recommendation}`
          : `${festival.name} is today! Expected orders: ${orderVolume.multiplier}x normal. ${recommendation}`;
      }
      return isNepali
        ? "आज कुनै ठूलो पर्व छैन। सामान्य डेलिभरी अपेक्षित।"
        : "No major festivals today. Normal delivery volume expected.";
    }

    case "suggest_festival_food": {
      const foods = data.foods || data.data?.foods || [];
      const foodsNepali = data.foodsNepali || data.data?.foodsNepali || [];
      const description = data.description || data.data?.description || "";
      const festival = data.festival || data.data?.festival;

      if (foods.length === 0) {
        return isNepali
          ? "भोजन सुझाव उपलब्ध छैन।"
          : "Food suggestions not available.";
      }

      const foodList = isNepali
        ? foodsNepali.slice(0, 5).join(", ")
        : foods.slice(0, 5).join(", ");

      return isNepali
        ? `${festival ? festival + " पर्वको" : ""} पारम्परिक खाना: ${foodList}। ${description}`
        : `Traditional${festival ? ` ${festival} festival` : ""} food: ${foodList}. ${description}`;
    }

    case "get_regional_preferences": {
      const typicalOrders = data.typicalOrders || data.data?.typicalOrders || {};
      const preferences = data.preferences || data.data?.preferences || {};
      const recommendation = data.recommendation || data.data?.recommendation || "";

      const popular = typicalOrders.popular || [];
      const popularList = isNepali
        ? popular.slice(0, 5).join(", ")
        : popular.slice(0, 5).join(", ");

      return isNepali
        ? `लोकप्रिय भोजन: ${popularList}। सुझाव: ${recommendation}`
        : `Popular foods: ${popularList}. Recommendation: ${recommendation}`;
    }

    case "web_search_restaurant": {
      const response = data.response || data.data?.response;
      
      if (response) {
        return response;
      }
      
      const restaurant = data.restaurant || data.data?.restaurant || {};
      const queryType = data.queryType || data.data?.queryType || "general";
      
      if (!restaurant || !restaurant.name) {
        return isNepali
          ? "रेस्टुरेन्ट जानकारी भेटिएन।"
          : "Restaurant information not found.";
      }
      
      let info = isNepali
        ? `${restaurant.name} को बारेमा जानकारी:\n`
        : `Information about ${restaurant.name}:\n`;
      
      if (restaurant.phone) {
        info += isNepali ? `फोन: ${restaurant.phone}\n` : `Phone: ${restaurant.phone}\n`;
      }
      if (restaurant.address) {
        info += isNepali ? `ठेगाना: ${restaurant.address}\n` : `Address: ${restaurant.address}\n`;
      }
      if (restaurant.rating) {
        info += isNepali ? `रेटिंग: ${restaurant.rating}\n` : `Rating: ${restaurant.rating}\n`;
      }
      
      return info.trim();
    }

    case "get_current_weather": {
      const weather = data.weather || data.data?.weather;
      const summary = data.summary || data.data?.summary || "";
      const comfort = data.comfort || data.data?.comfort || {};
      
      if (!weather) {
        return isNepali
          ? "मौसम जानकारी उपलब्ध छैन।"
          : "Weather information not available.";
      }

      return isNepali
        ? `${summary} ${comfort.description || ""}`
        : `${summary} ${comfort.description || ""}`;
    }

    case "suggest_weather_based_food": {
      const recommendations = data.recommendations || data.data?.recommendations || {};
      const message = data.message || data.data?.message || "";
      const foods = recommendations.foods || [];
      const foodsNepali = recommendations.foodsNepali || [];
      const beverages = recommendations.beverages || [];
      const tip = recommendations.tip || "";

      if (foods.length === 0) {
        return isNepali
          ? "मौसम आधारित भोजन सुझाव उपलब्ध छैन।"
          : "Weather-based food suggestions not available.";
      }

      const foodList = isNepali
        ? foodsNepali.slice(0, 5).join(", ")
        : foods.slice(0, 5).join(", ");

      const beverageList = beverages.slice(0, 3).join(", ");

      return isNepali
        ? `${message} सुझावित खाना: ${foodList}। पेय पदार्थ: ${beverageList}। ${tip}`
        : `${message} Recommended foods: ${foodList}. Beverages: ${beverageList}. ${tip}`;
    }

    default:
      return isNepali
        ? "जानकारी प्राप्त भयो।"
        : "Information retrieved successfully.";
  }
}

// Get chat history
export const getChatHistory = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    const total = await Chat.countDocuments();
    const chats = await Chat.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.status(200).json({
      success: true,
      data: chats,
      meta: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit),
      },
    });
  } catch (err) {
    console.error("❌ Error fetching chat history:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chat history",
    });
  }
};

// In-memory cache for orders data
let ordersCache = null;
let ordersCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to load orders from JSON file with caching
const loadOrders = () => {
  const now = Date.now();
  
  // Return cached data if fresh
  if (ordersCache && (now - ordersCacheTime) < CACHE_TTL) {
    return ordersCache;
  }
  
  // Load from disk and update cache
  try {
    const ordersPath = path.join(__dirname, "../dummy data/orders.json");
    const ordersData = fs.readFileSync(ordersPath, "utf8");
    ordersCache = JSON.parse(ordersData);
    ordersCacheTime = now;
    return ordersCache;
  } catch (error) {
    console.error("❌ Error loading orders:", error.message);
    return [];
  }
};

// Get all orders endpoint
export const getAllOrders = async (req, res) => {
  try {
    const orders = loadOrders();

    res.status(200).json({
      success: true,
      data: orders,
      count: orders.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error fetching orders:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get order by ID endpoint
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = loadOrders();

    const order = orders.find(
      (o) => o.orderId === orderId || o.orderNumber === orderId
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error fetching order:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch order",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Track order endpoint (using real order data)
export const trackOrder = async (req, res) => {
  try {
    const { orderId, userLat, userLng } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    console.log(`🚚 Tracking order: ${orderId}`);

    // Load orders from JSON file
    const orders = loadOrders();

    // Find the order by ID or order number
    const order = orders.find(
      (o) => o.orderId === orderId || o.orderNumber === orderId
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found. Please check your Order ID.",
      });
    }

    console.log(
      `✅ Found order: ${order.orderNumber} - Status: ${order.status}`
    );

    if (userLat && userLng) {
      console.log(`📍 User location: [${userLat}, ${userLng}]`);
    }

    // Get restaurant and customer locations
    const restaurantLat = order.restaurant.address.latitude;
    const restaurantLng = order.restaurant.address.longitude;

    // Use user's real-time location if provided, otherwise use order's delivery address
    const destinationLat = userLat
      ? parseFloat(userLat)
      : order.customer.deliveryAddress.latitude;
    const destinationLng = userLng
      ? parseFloat(userLng)
      : order.customer.deliveryAddress.longitude;

    // Get delivery person location from order data
    let deliveryLat = order.delivery.currentLocation.latitude;
    let deliveryLng = order.delivery.currentLocation.longitude;

    // For live tracking during "on_the_way" stage, add slight movement
    if (order.status === "on_the_way") {
      const randomOffsetLat = (Math.random() - 0.5) * 0.0002;
      const randomOffsetLng = (Math.random() - 0.5) * 0.0002;
      deliveryLat += randomOffsetLat;
      deliveryLng += randomOffsetLng;
    }

    // Fetch road route from OSRM (OpenStreetMap Routing Machine)
    let roadRoute = null;
    try {
      const routeResponse = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${restaurantLng},${restaurantLat};${destinationLng},${destinationLat}?overview=full&geometries=geojson`
      );
      const routeData = await routeResponse.json();

      if (routeData.code === "Ok" && routeData.routes && routeData.routes[0]) {
        const routeCoords = routeData.routes[0].geometry.coordinates;
        roadRoute = routeCoords.map((coord) => [coord[1], coord[0]]);
        console.log(`🗺️ Road route calculated: ${roadRoute.length} points`);
      }
    } catch (error) {
      console.error("❌ Error fetching road route:", error.message);
      roadRoute = [
        [restaurantLat, restaurantLng],
        [deliveryLat, deliveryLng],
        [destinationLat, destinationLng],
      ];
    }

    // Map timeline stages to frontend format
    const stages = order.timeline.map((stage) => ({
      id:
        stage.stage === "order_placed"
          ? 1
          : stage.stage === "order_preparing"
          ? 2
          : stage.stage === "order_ready"
          ? 3
          : stage.stage === "on_the_way"
          ? 4
          : 5,
      name:
        stage.stage === "order_placed"
          ? "Order Placed"
          : stage.stage === "order_preparing"
          ? "Order being Prepared"
          : stage.stage === "order_ready"
          ? "Order Ready for Delivery"
          : stage.stage === "on_the_way"
          ? "Order is on the Way"
          : "Order Delivered",
      completed: stage.status === "completed",
      timestamp: stage.timestamp,
    }));

    const deliveryData = {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      restaurantName: order.restaurant.name,
      restaurantLocation: order.restaurant.address.area,
      eta: order.currentETA,
      status:
        order.status === "order_placed"
          ? "Order Placed"
          : order.status === "order_preparing"
          ? "Order being Prepared"
          : order.status === "order_ready"
          ? "Order Ready for Delivery"
          : order.status === "on_the_way"
          ? "Order is on the Way"
          : "Order Delivered",
      currentStage: order.currentStage,
      orderPlacedAt: order.createdAt,
      elapsedMinutes: order.elapsedMinutes,
      location: {
        lat: deliveryLat,
        lng: deliveryLng,
      },
      destination: {
        lat: destinationLat,
        lng: destinationLng,
      },
      restaurant: {
        lat: restaurantLat,
        lng: restaurantLng,
        name: order.restaurant.name,
        phone: order.restaurant.phone,
      },
      roadRoute: roadRoute,
      driver: {
        name: order.delivery.driver.name,
        phone: order.delivery.driver.phone,
        vehicle: order.delivery.driver.vehicle.type,
        vehicleNumber: order.delivery.driver.vehicle.number,
        vehicleModel: order.delivery.driver.vehicle.model,
      },
      progress: {
        steps: stages,
      },
      items: order.items,
      total: order.total,
      paymentMethod: order.paymentMethod,
      deliveryInstructions: order.delivery.instructions,
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        address: order.customer.deliveryAddress,
      },
    };

    console.log(
      `✅ Order tracking data: Stage ${order.currentStage + 1}/5, ETA: ${
        order.currentETA
      } min`
    );

    res.status(200).json({
      success: true,
      data: deliveryData,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error tracking order:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to track order",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Analytics endpoint: Peak support times
export const getAnalyticsPeakTimes = async (req, res) => {
  try {
    const { days = 7 } = req.query; // Default to last 7 days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Aggregate queries by hour
    const peakTimes = await Chat.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
          avgLatency: { $avg: "$latencyMs" },
          escalations: { $sum: { $cond: ["$wasEscalated", 1, 0] } },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $project: {
          hour: "$_id",
          queryCount: "$count",
          avgLatencyMs: { $round: ["$avgLatency", 0] },
          escalationCount: "$escalations",
          _id: 0,
        },
      },
    ]);

    // Get meal rush times
    const mealRushes = peakTimes.filter((p) => 
      (p.hour >= 7 && p.hour <= 9) || // Breakfast: 7-9 AM
      (p.hour >= 1 && p.hour <= 3) || // Lunch: 1-3 PM
      (p.hour >= 7 && p.hour <= 9)    // Dinner: 7-9 PM
    );

    // Overall stats
    const totalQueries = await Chat.countDocuments({
      createdAt: { $gte: startDate },
    });
    const totalEscalations = await Chat.countDocuments({
      createdAt: { $gte: startDate },
      wasEscalated: true,
    });

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          days: parseInt(days),
        },
        overall: {
          totalQueries,
          totalEscalations,
          escalationRate: totalQueries > 0 ? (totalEscalations / totalQueries * 100).toFixed(2) : 0,
        },
        peakTimes,
        mealRushes,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error fetching peak times:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch peak time analytics",
    });
  }
};

// Analytics endpoint: Problematic areas and restaurants
export const getAnalyticsProblemAreas = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Aggregate by intent (payment_issue, delivery_problem, etc.)
    const intentDistribution = await Chat.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          intent: { $exists: true },
        },
      },
      {
        $group: {
          _id: "$intent",
          count: { $sum: 1 },
          escalationCount: { $sum: { $cond: ["$wasEscalated", 1, 0] } },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $project: {
          intent: "$_id",
          count: 1,
          escalationCount: 1,
          escalationRate: {
            $cond: [{ $eq: ["$count", 0] }, 0, { $multiply: [{ $divide: ["$escalationCount", "$count"] }, 100] }],
          },
          _id: 0,
        },
      },
    ]);

    // Get problematic restaurants from tickets
    const problematicRestaurants = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$metadata.restaurantName",
          ticketCount: { $sum: 1 },
          urgentCount: {
            $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] },
          },
          avgDelayMinutes: { $avg: "$delayMinutes" },
        },
      },
      {
        $match: { ticketCount: { $gte: 2 } }, // At least 2 tickets
      },
      {
        $sort: { ticketCount: -1 },
      },
      {
        $limit: 10, // Top 10 problematic
      },
      {
        $project: {
          restaurantName: "$_id",
          ticketCount: 1,
          urgentCount: 1,
          avgDelayMinutes: { $round: ["$avgDelayMinutes", 0] },
          _id: 0,
        },
      },
    ]);

    // Common delivery areas with issues (from Chat metadata)
    const orderIdsWithIssues = await Ticket.distinct("orderId", {
      createdAt: { $gte: startDate },
    });

    // Get unique intents for problem identification
    const problemIntents = intentDistribution.filter(
      (i) =>
        i.intent === "payment_issue" ||
        i.intent === "delivery_problem" ||
        i.intent === "refund_request"
    );

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          days: parseInt(days),
        },
        intentDistribution,
        problemIntents,
        problematicRestaurants,
        affectedOrders: orderIdsWithIssues.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error fetching problem areas:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch problem area analytics",
    });
  }
};

// Analytics endpoint: General overview
export const getAnalyticsOverview = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Overall chat stats
    const totalChats = await Chat.countDocuments({
      createdAt: { $gte: startDate },
    });

    const avgLatency = await Chat.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          latencyMs: { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          avgLatency: { $avg: "$latencyMs" },
        },
      },
    ]);

    // Method distribution (RAG vs MCP)
    const methodDistribution = await Chat.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$method",
          count: { $sum: 1 },
        },
      },
    ]);

    // Language distribution
    const languageDistribution = await Chat.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$language",
          count: { $sum: 1 },
        },
      },
    ]);

    // Total tickets
    const totalTickets = await Ticket.countDocuments({
      createdAt: { $gte: startDate },
    });

    const resolvedTickets = await Ticket.countDocuments({
      createdAt: { $gte: startDate },
      status: { $in: ["resolved", "closed"] },
    });

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          days: parseInt(days),
        },
        chatStats: {
          totalChats,
          avgLatencyMs: avgLatency[0]?.avgLatency
            ? Math.round(avgLatency[0].avgLatency)
            : 0,
          methodDistribution,
          languageDistribution,
        },
        ticketStats: {
          totalTickets,
          resolvedTickets,
          resolutionRate:
            totalTickets > 0
              ? ((resolvedTickets / totalTickets) * 100).toFixed(2)
              : 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error fetching analytics overview:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch analytics overview",
    });
  }
};
