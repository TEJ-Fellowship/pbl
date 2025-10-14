import Chat from "../models/Chat.js";
import { retrieveTopSections, askGemini } from "../retriverQA/retriever.js";

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

// Handle chat request
export const handleChat = async (req, res) => {
  const startTime = Date.now();

  try {
    const { question, language = "en" } = req.body;

    console.log(`📝 New question: "${question}" (Language: ${language})`);

    // Retrieve relevant context from Pinecone
    console.log("🔍 Searching for relevant context...");
    const topSections = await retrieveTopSections(question, 3);

    if (topSections.length === 0) {
      console.warn("⚠️ No relevant context found");
    } else {
      console.log(`✅ Found ${topSections.length} relevant sections`);
    }

    // Generate answer using Gemini
    console.log("🤖 Generating answer with Gemini...");
    const answer = await askGemini(question, topSections, language);

    // Save chat to DB
    const newChat = new Chat({ question, answer, language });
    await newChat.save();
    console.log(`💾 Chat saved to database (ID: ${newChat._id})`);

    const duration = Date.now() - startTime;
    console.log(`✅ Request completed in ${duration}ms`);

    res.status(200).json({
      success: true,
      answer: answer, // Frontend expects 'answer' field directly
      data: {
        question,
        answer,
        chatId: newChat._id,
        timestamp: newChat.createdAt,
        language,
      },
      meta: {
        sectionsFound: topSections.length,
        processingTime: `${duration}ms`,
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
