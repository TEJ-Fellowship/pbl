import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHybridRetriever } from "../src/hybrid-retriever.js";
import { embedSingle } from "../src/utils/embeddings.js";
import { connectDB } from "../config/db.js";
import BufferWindowMemory from "../src/memory/BufferWindowMemory.js";
import MarkdownIt from "markdown-it";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { multiTurnManager } from "../src/multi-turn-conversation.js";

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

async function initializeAI() {
  if (retriever && model) return; // Already initialized

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
  } catch (error) {
    console.error("Failed to initialize AI components:", error);
    throw error;
  }
}

// Main chat function with multi-turn conversation support
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

    // Get conversation history for multi-turn processing
    const conversationHistory = await getConversationHistory(sessionId);
    const messages = conversationHistory.messages || [];

    // Create user message
    const userMessage = new Message({
      conversationId: conversation._id,
      role: "user",
      content: message,
    });
    await userMessage.save();

    // Add message to conversation
    await conversation.addMessage(userMessage._id);

    // Use multi-turn conversation manager for enhanced context
    const enhancedContext = await multiTurnManager.buildEnhancedContext(
      message,
      sessionId,
      messages,
      [] // Will be populated after search
    );

    // Check if clarification is needed
    if (enhancedContext.needsClarification) {
      const clarificationMessage = new Message({
        conversationId: conversation._id,
        role: "assistant",
        content: enhancedContext.clarificationQuestion,
        metadata: {
          searchResults: [],
          modelUsed: "multi-turn-clarification",
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
          clarificationRequest: true,
        },
      });
      await clarificationMessage.save();
      await conversation.addMessage(clarificationMessage._id);

      return {
        answer: enhancedContext.clarificationQuestion,
        confidence: {
          score: 100,
          level: "High",
          factors: ["Clarification request"],
        },
        sources: [],
        needsClarification: true,
        conversationState: enhancedContext.conversationState,
        followUpDetection: enhancedContext.followUpDetection,
        ambiguityDetection: enhancedContext.ambiguityDetection,
      };
    }

    // Use enhanced contextual query for search
    const queryEmbedding = await embedSingle(enhancedContext.contextualQuery);

    // Perform hybrid search with enhanced contextual query
    const results = await retriever.search({
      query: enhancedContext.contextualQuery,
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

    // Use multi-turn conversation manager for enhanced response generation
    const enhancedResponse = await multiTurnManager.generateEnhancedResponse(
      message,
      sessionId,
      messages,
      results
    );

    const answer = enhancedResponse.answer;

    // Calculate confidence score
    const confidence = calculateConfidence(results, answer);

    // Create assistant message with multi-turn metadata
    const assistantMessage = new Message({
      conversationId: conversation._id,
      role: "assistant",
      content: answer,
      metadata: {
        searchResults: results.map((r) => ({
          title: r.metadata?.title || "Unknown",
          source_url: r.metadata?.source_url || "N/A",
          category: r.metadata?.category || "unknown",
          score: r.score,
          searchType: r.searchType,
        })),
        modelUsed: "gemini-1.5-flash-multi-turn",
        processingTime: Date.now() - startTime,
        tokensUsed: 0, // Will be updated if token counting is implemented
        multiTurnContext: {
          turnCount: enhancedResponse.conversationState.turnCount,
          isFollowUp: enhancedResponse.followUpDetection.isFollowUp,
          userPreferences: enhancedResponse.conversationState.userPreferences,
          contextualQuery: enhancedResponse.contextualQuery,
        },
      },
    });
    await assistantMessage.save();
    await conversation.addMessage(assistantMessage._id);

    return {
      answer,
      confidence,
      sources: results.map((r, i) => ({
        id: i + 1,
        title: r.metadata?.title || "Unknown",
        url: r.metadata?.source_url || "N/A",
        category: r.metadata?.category || "unknown",
        score: r.score,
        searchType: r.searchType,
        content: r.doc,
      })),
      multiTurnContext: {
        turnCount: enhancedResponse.conversationState.turnCount,
        isFollowUp: enhancedResponse.followUpDetection.isFollowUp,
        followUpConfidence: enhancedResponse.followUpDetection.confidence,
        userPreferences: enhancedResponse.conversationState.userPreferences,
        contextualQuery: enhancedResponse.contextualQuery,
        conversationStats: multiTurnManager.getConversationStats(sessionId),
      },
    };
  } catch (error) {
    console.error("Error processing chat message:", error);
    throw error;
  }
}

// Handle clarification responses
export async function processClarificationResponse(
  clarificationResponse,
  originalQuestion,
  sessionId
) {
  try {
    await initializeAI();

    const startTime = Date.now();

    // Get conversation
    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Process clarification with multi-turn manager
    const clarificationResult =
      await multiTurnManager.processClarificationResponse(
        clarificationResponse,
        originalQuestion,
        sessionId
      );

    // Create user clarification message
    const clarificationMessage = new Message({
      conversationId: conversation._id,
      role: "user",
      content: clarificationResponse,
      metadata: {
        clarificationResponse: true,
        originalQuestion: originalQuestion,
      },
    });
    await clarificationMessage.save();
    await conversation.addMessage(clarificationMessage._id);

    // Get conversation history
    const conversationHistory = await getConversationHistory(sessionId);
    const messages = conversationHistory.messages || [];

    // Perform search with clarified query
    const queryEmbedding = await embedSingle(
      clarificationResult.clarifiedQuery
    );
    const results = await retriever.search({
      query: clarificationResult.clarifiedQuery,
      queryEmbedding,
      k: 8,
    });

    // Generate enhanced response
    const enhancedResponse = await multiTurnManager.generateEnhancedResponse(
      clarificationResult.clarifiedQuery,
      sessionId,
      messages,
      results
    );

    const answer = enhancedResponse.answer;
    const confidence = calculateConfidence(results, answer);

    // Create assistant message
    const assistantMessage = new Message({
      conversationId: conversation._id,
      role: "assistant",
      content: answer,
      metadata: {
        searchResults: results.map((r) => ({
          title: r.metadata?.title || "Unknown",
          source_url: r.metadata?.source_url || "N/A",
          category: r.metadata?.category || "unknown",
          score: r.score,
          searchType: r.searchType,
        })),
        modelUsed: "gemini-1.5-flash-clarification",
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        clarificationProcessed: true,
        multiTurnContext: {
          turnCount: enhancedResponse.conversationState.turnCount,
          isFollowUp: enhancedResponse.followUpDetection.isFollowUp,
          userPreferences: enhancedResponse.conversationState.userPreferences,
          contextualQuery: enhancedResponse.contextualQuery,
        },
      },
    });
    await assistantMessage.save();
    await conversation.addMessage(assistantMessage._id);

    return {
      answer,
      confidence,
      sources: results.map((r, i) => ({
        id: i + 1,
        title: r.metadata?.title || "Unknown",
        url: r.metadata?.source_url || "N/A",
        category: r.metadata?.category || "unknown",
        score: r.score,
        searchType: r.searchType,
        content: r.doc,
      })),
      multiTurnContext: {
        turnCount: enhancedResponse.conversationState.turnCount,
        isFollowUp: enhancedResponse.followUpDetection.isFollowUp,
        followUpConfidence: enhancedResponse.followUpDetection.confidence,
        userPreferences: enhancedResponse.conversationState.userPreferences,
        contextualQuery: enhancedResponse.contextualQuery,
        conversationStats: multiTurnManager.getConversationStats(sessionId),
        clarificationProcessed: true,
      },
    };
  } catch (error) {
    console.error("Error processing clarification response:", error);
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

// Get conversation statistics and multi-turn context
export async function getConversationStats(sessionId) {
  try {
    await connectDB();

    const conversation = await Conversation.findOne({ sessionId }).populate({
      path: "messages",
      options: { sort: { timestamp: 1 } },
    });

    if (!conversation) {
      return {
        conversation: null,
        multiTurnStats: null,
        messageCount: 0,
      };
    }

    const multiTurnStats = multiTurnManager.getConversationStats(sessionId);

    return {
      conversation: {
        id: conversation._id,
        sessionId: conversation.sessionId,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messages.length,
      },
      multiTurnStats,
      messageCount: conversation.messages.length,
    };
  } catch (error) {
    console.error("Error getting conversation stats:", error);
    throw error;
  }
}

// Clean up conversation state (for memory management)
export async function cleanupConversationState(sessionId) {
  try {
    multiTurnManager.cleanupConversationState(sessionId);
    return { success: true, message: "Conversation state cleaned up" };
  } catch (error) {
    console.error("Error cleaning up conversation state:", error);
    throw error;
  }
}
