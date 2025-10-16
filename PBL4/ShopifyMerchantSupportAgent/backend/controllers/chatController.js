import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHybridRetriever } from "../src/hybrid-retriever.js";
import { embedSingle } from "../src/utils/embeddings.js";
import { connectDB } from "../config/db.js";
import BufferWindowMemory from "../src/memory/BufferWindowMemory.js";
import MarkdownIt from "markdown-it";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import MCPOrchestrator from "../src/mcp/mcpOrchestrator.js";

// Initialize markdown renderer
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// Enhanced confidence scoring function
function calculateConfidence(results, answer) {
  let confidence = 0;
  let confidenceFactors = [];

  // Factor 1: Number of relevant sources (0-25 points)
  const sourceCount = results.length;
  if (sourceCount >= 6) {
    confidence += 25;
    confidenceFactors.push("Multiple comprehensive sources found");
  } else if (sourceCount >= 4) {
    confidence += 20;
    confidenceFactors.push("Several relevant sources found");
  } else if (sourceCount >= 2) {
    confidence += 15;
    confidenceFactors.push("Some relevant sources found");
  } else if (sourceCount >= 1) {
    confidence += 10;
    confidenceFactors.push("Limited sources found");
  }

  // Factor 2: Average relevance score (0-25 points)
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;
  if (avgScore >= 0.8) {
    confidence += 25;
    confidenceFactors.push("Very high relevance scores");
  } else if (avgScore >= 0.6) {
    confidence += 20;
    confidenceFactors.push("High relevance scores");
  } else if (avgScore >= 0.4) {
    confidence += 15;
    confidenceFactors.push("Good relevance scores");
  } else if (avgScore >= 0.2) {
    confidence += 10;
    confidenceFactors.push("Moderate relevance scores");
  } else {
    confidence += 5;
    confidenceFactors.push("Low relevance scores");
  }

  // Factor 3: Answer quality indicators (0-25 points)
  const answerLength = answer.length;
  const hasCodeBlocks = answer.includes("```") || answer.includes("`");
  const hasSpecifics =
    answer.includes("API") ||
    answer.includes("endpoint") ||
    answer.includes("parameter") ||
    answer.includes("step");
  const hasExamples =
    answer.includes("example") ||
    answer.includes("for instance") ||
    answer.includes("such as");
  const hasSteps =
    answer.includes("1.") || answer.includes("2.") || answer.includes("Step");

  if (answerLength > 500 && hasSpecifics && (hasExamples || hasSteps)) {
    confidence += 25;
    confidenceFactors.push(
      "Comprehensive answer with specific details and examples"
    );
  } else if (answerLength > 300 && (hasSpecifics || hasCodeBlocks)) {
    confidence += 20;
    confidenceFactors.push("Detailed answer with technical information");
  } else if (answerLength > 200 && (hasExamples || hasSteps)) {
    confidence += 15;
    confidenceFactors.push("Good answer with practical guidance");
  } else if (answerLength > 100) {
    confidence += 10;
    confidenceFactors.push("Basic answer provided");
  } else {
    confidence += 5;
    confidenceFactors.push("Minimal answer");
  }

  // Factor 4: Search method diversity (0-25 points)
  const searchTypes = [...new Set(results.map((r) => r.searchType))];
  if (searchTypes.length >= 3) {
    confidence += 25;
    confidenceFactors.push(
      "Multiple search methods used for comprehensive coverage"
    );
  } else if (searchTypes.length >= 2) {
    confidence += 20;
    confidenceFactors.push("Hybrid search methods used");
  } else {
    confidence += 15;
    confidenceFactors.push("Single search method used");
  }

  // Factor 5: Category diversity bonus (0-10 points)
  const categories = [
    ...new Set(results.map((r) => r.metadata?.category || "unknown")),
  ];
  if (categories.length >= 4) {
    confidence += 10;
    confidenceFactors.push("High category diversity in sources");
  } else if (categories.length >= 2) {
    confidence += 5;
    confidenceFactors.push("Good category diversity");
  }

  // Determine confidence level
  let confidenceLevel;
  if (confidence >= 85) {
    confidenceLevel = "Very High";
  } else if (confidence >= 70) {
    confidenceLevel = "High";
  } else if (confidence >= 55) {
    confidenceLevel = "Medium";
  } else if (confidence >= 40) {
    confidenceLevel = "Low";
  } else {
    confidenceLevel = "Very Low";
  }

  return {
    score: Math.min(confidence, 100),
    level: confidenceLevel,
    factors: confidenceFactors,
  };
}

// Handle edge cases with fallback responses
function handleEdgeCases(results, question) {
  if (results.length === 0) {
    return {
      answer:
        "I couldn't find this information in the available documentation. Please try rephrasing your question or contact Shopify support for assistance.",
      confidence: { score: 0, level: "Low", factors: ["No sources found"] },
      isEdgeCase: true,
    };
  }

  // Check for very low relevance scores
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;
  if (avgScore < 0.2) {
    return {
      answer:
        "I found some related information, but it may not directly answer your question. Please try rephrasing your question with more specific terms or contact Shopify support for assistance.",
      confidence: {
        score: 20,
        level: "Low",
        factors: ["Very low relevance scores"],
      },
      isEdgeCase: true,
    };
  }

  return null; // No edge case detected
}

// Initialize AI components
let retriever = null;
let model = null;
let genAI = null;
let mcpOrchestrator = null;

async function initializeAI() {
  if (retriever && model && mcpOrchestrator) return; // Already initialized

  try {
    await connectDB();

    retriever = await createHybridRetriever({
      semanticWeight: 0.7, // Increased for better context understanding
      keywordWeight: 0.3,
      maxResults: 20, // More results for better fusion
      finalK: 8, // More comprehensive answers
      diversityBoost: 0.15, // Better category diversity
      minRelevanceScore: 0.1, // Filter out low-relevance results
      queryExpansion: true, // Enable query expansion
    });

    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    let modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    try {
      model = genAI.getGenerativeModel({ model: modelName });
    } catch (err) {
      if (modelName !== "gemini-1.5-flash") {
        modelName = "gemini-1.5-flash";
        model = genAI.getGenerativeModel({ model: modelName });
      } else {
        throw err;
      }
    }

    // Initialize MCP Orchestrator
    mcpOrchestrator = new MCPOrchestrator();
    console.log("🔧 MCP Orchestrator initialized successfully");
  } catch (error) {
    console.error("Failed to initialize AI components:", error);
    throw error;
  }
}

// Main chat function
export async function processChatMessage(message, sessionId) {
  try {
    await initializeAI();

    const startTime = Date.now();

    // Get or create conversation
    let conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        title: message.length > 50 ? message.substring(0, 50) + "..." : message,
      });
      await conversation.save();
    }

    // Create user message
    const userMessage = new Message({
      conversationId: conversation._id,
      role: "user",
      content: message,
    });
    await userMessage.save();

    // Add message to conversation
    await conversation.addMessage(userMessage._id);

    // Initialize memory for this session
    const memory = new BufferWindowMemory({
      windowSize: 8,
      sessionId: sessionId,
      maxTokens: 6000,
      modelName: "gemini-2.5-flash",
      prioritizeRecent: true,
      prioritizeRelevance: true,
    });

    await memory.initializeConversation();

    // Get conversation context
    const conversationContext = await memory.getConversationContext();
    const contextualQuery = conversationContext
      ? `${conversationContext}Current question: ${message}`
      : message;
    const queryEmbedding = await embedSingle(contextualQuery);

    // Perform hybrid search
    const results = await retriever.search({
      query: contextualQuery,
      queryEmbedding,
      k: 8, // Increased for more comprehensive results
    });

    // Check for edge cases
    const edgeCase = handleEdgeCases(results, message);
    if (edgeCase) {
      const assistantMessage = new Message({
        conversationId: conversation._id,
        role: "assistant",
        content: edgeCase.answer,
        metadata: {
          searchResults: results.map((r) => ({
            title: r.metadata?.title || "Unknown",
            source_url: r.metadata?.source_url || "N/A",
            category: r.metadata?.category || "unknown",
            score: r.score,
            searchType: r.searchType,
          })),
          modelUsed: "gemini-2.5-flash",
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
        },
      });
      await assistantMessage.save();
      await conversation.addMessage(assistantMessage._id);

      return {
        answer: edgeCase.answer,
        confidence: edgeCase.confidence,
        sources: results.map((r, i) => ({
          id: i + 1,
          title: r.metadata?.title || "Unknown",
          url: r.metadata?.source_url || "N/A",
          category: r.metadata?.category || "unknown",
          score: r.score,
          searchType: r.searchType,
          content: r.doc,
        })),
        isEdgeCase: true,
      };
    }

    // Get token-aware context window
    const systemPrompt = `You are a helpful Shopify merchant support agent. Use the provided context to answer questions accurately and helpfully.`;
    const tokenAwareContext = await memory.getTokenAwareContext(
      results,
      systemPrompt
    );

    const context = tokenAwareContext.documents
      .map(
        (r, i) =>
          `[Source ${i + 1}] ${r.metadata?.title || "Unknown"} (${
            r.metadata?.source_url || "N/A"
          })\n${r.doc}`
      )
      .join("\n\n---\n\n");

    // Build conversation history
    const conversationHistory =
      tokenAwareContext.messages.length > 0
        ? tokenAwareContext.messages
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join("\n")
        : "";

    const prompt = `You are an expert Shopify Merchant Support Assistant with deep knowledge of Shopify's platform, APIs, and best practices.

CONTEXT: You have access to comprehensive Shopify documentation including:
- Shopify platform overview and getting started guides
- Product and inventory management
- Order fulfillment and shipping
- Theme development and customization
- API documentation (REST Admin API, GraphQL Admin API, Storefront API)
- App development and integrations
- Community discussions and solutions

INSTRUCTIONS:
1. **Answer comprehensively**: Use the provided documentation context to give detailed, actionable answers
2. **Be specific**: Include specific steps, API endpoints, code examples, or configuration details when relevant
3. **Provide context**: Explain not just what to do, but why and when to use different approaches
4. **Use examples**: Include practical examples, code snippets, or step-by-step instructions
5. **Cite sources**: Reference specific sources using "According to [Source X]..." format
6. **Be helpful**: If the context doesn't fully answer the question, provide the best available information and suggest next steps
7. **Format clearly**: Use markdown formatting (bold, lists, code blocks, etc.) for better readability
8. **Maintain continuity**: Reference previous conversation context when relevant

RESPONSE GUIDELINES:
- For API questions: Include endpoint details, parameters, and example requests/responses
- For setup questions: Provide step-by-step instructions with specific settings
- For troubleshooting: Offer multiple solutions and explain when to use each
- For general questions: Give comprehensive overviews with practical applications

${conversationHistory ? `CONVERSATION HISTORY:\n${conversationHistory}\n` : ""}

RETRIEVED DOCUMENTATION:
${context}

USER QUESTION: ${message}

EXPERT ANSWER:`;

    // Generate response
    let result;
    try {
      result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });
    } catch (err) {
      const msg = (err && err.message) || "";
      const unavailable =
        msg.includes("not available") ||
        msg.includes("404") ||
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("model not found");

      if (unavailable) {
        result = { response: { text: () => "No response generated." } };
      } else {
        throw err;
      }
    }

    const answer = result.response?.text() || "No response generated.";

    // Calculate confidence score
    const confidence = calculateConfidence(tokenAwareContext.documents, answer);

    // Process with MCP tools if needed
    let enhancedAnswer = answer;
    let toolResults = {};
    let toolsUsed = [];

    if (mcpOrchestrator) {
      try {
        const mcpResult = await mcpOrchestrator.processWithTools(
          message,
          confidence.score / 100, // Convert to 0-1 scale
          answer
        );
        enhancedAnswer = mcpResult.enhancedAnswer;
        toolResults = mcpResult.toolResults;
        toolsUsed = mcpResult.toolsUsed;
      } catch (error) {
        console.error("MCP processing error:", error);
        // Continue with original answer if MCP fails
      }
    }

    // Create assistant message
    const assistantMessage = new Message({
      conversationId: conversation._id,
      role: "assistant",
      content: enhancedAnswer,
      metadata: {
        searchResults: tokenAwareContext.documents.map((r) => ({
          title: r.metadata?.title || "Unknown",
          source_url: r.metadata?.source_url || "N/A",
          category: r.metadata?.category || "unknown",
          score: r.score,
          searchType: r.searchType,
        })),
        modelUsed: "gemini-2.5-flash",
        processingTime: Date.now() - startTime,
        tokensUsed: tokenAwareContext.tokenUsage.totalTokens,
        mcpTools: {
          toolsUsed: toolsUsed,
          toolResults: toolResults,
        },
      },
    });
    await assistantMessage.save();
    await conversation.addMessage(assistantMessage._id);

    return {
      answer: enhancedAnswer,
      confidence,
      sources: tokenAwareContext.documents.map((r, i) => ({
        id: i + 1,
        title: r.metadata?.title || "Unknown",
        url: r.metadata?.source_url || "N/A",
        category: r.metadata?.category || "unknown",
        score: r.score,
        searchType: r.searchType,
        content: r.doc,
      })),
      tokenUsage: tokenAwareContext.tokenUsage,
      truncated: tokenAwareContext.truncated,
      mcpTools: {
        toolsUsed: toolsUsed,
        toolResults: toolResults,
      },
    };
  } catch (error) {
    console.error("Error processing chat message:", error);
    throw error;
  }
}

// Get conversation history
export async function getConversationHistory(sessionId) {
  try {
    await connectDB();

    const conversation = await Conversation.findOne({ sessionId }).populate({
      path: "messages",
      options: { sort: { timestamp: 1 } },
    });

    if (!conversation) {
      return { messages: [], conversation: null };
    }

    const messages = conversation.messages.map((msg) => ({
      id: msg._id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      metadata: msg.metadata,
    }));

    return {
      messages,
      conversation: {
        id: conversation._id,
        sessionId: conversation.sessionId,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error getting conversation history:", error);
    throw error;
  }
}

// Get chat history list (last 8 conversations)
export async function getChatHistoryList() {
  try {
    await connectDB();

    // Get the last 8 conversations ordered by updatedAt (most recent first)
    const conversations = await Conversation.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .limit(8)
      .select("sessionId title createdAt updatedAt messages")
      .populate({
        path: "messages",
        options: { sort: { timestamp: -1 }, limit: 1 }, // Get only the last message for preview
        select: "content timestamp role",
      });

    const historyList = conversations.map((conv) => ({
      id: conv._id,
      sessionId: conv.sessionId,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      lastMessage:
        conv.messages && conv.messages.length > 0
          ? {
              content: conv.messages[0].content,
              timestamp: conv.messages[0].timestamp,
              role: conv.messages[0].role,
            }
          : null,
      messageCount: conv.messages ? conv.messages.length : 0,
    }));

    return { conversations: historyList };
  } catch (error) {
    console.error("Error getting chat history list:", error);
    throw error;
  }
}
