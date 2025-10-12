import { GoogleGenerativeAI } from "@google/generative-ai";
import { HybridRetriever } from "./hybrid-retriever.js";
import InMemoryBufferWindowMemory from "../memory/InMemoryBufferWindowMemory.js";
import ContextWindowManager from "./context/ContextWindowManager.js";
import { embeddingService } from "./FallbackEmbeddingService.js";
import { v4 as uuidv4 } from "uuid";

class EnhancedChatService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isGeminiAvailable = false;

    this.initializeGemini();
    this.hybridRetriever = new HybridRetriever();
    this.contextManager = new ContextWindowManager({
      maxTokens: 6000,
      model: "gpt-3.5-turbo",
    });
  }

  /**
   * Initialize Gemini AI with error handling
   */
  initializeGemini() {
    try {
      if (
        process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"
      ) {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
        this.model = this.genAI.getGenerativeModel({ model: modelName });
        this.isGeminiAvailable = true;
        console.log("✅ Gemini AI initialized successfully");
      } else {
        console.log(
          "⚠️  Gemini API key not configured - using fallback responses"
        );
      }
    } catch (error) {
      console.error("❌ Error initializing Gemini AI:", error.message);
      this.isGeminiAvailable = false;
    }
  }

  /**
   * Initialize memory for a session
   */
  initializeMemory(sessionId) {
    return new InMemoryBufferWindowMemory(sessionId, {
      k: 8, // Last 8 messages (4 turns)
      maxTokens: 6000,
    });
  }

  /**
   * Process chat message with memory and context windowing
   */
  async processMessage(sessionId, userMessage) {
    try {
      // Initialize memory for this session
      const memory = this.initializeMemory(sessionId);

      // Load conversation history
      const memoryVariables = await memory.loadMemoryVariables({
        input: userMessage,
      });
      const conversationHistory = memoryVariables.history || [];

      // Retrieve relevant documents using hybrid search
      const retrievedDocs = await this.hybridRetriever.search({
        query: userMessage,
        queryEmbedding: await this.getEmbedding(userMessage),
        k: 6,
      });

      // Convert retrieved docs to the format expected by context manager
      const formattedDocs = retrievedDocs.map((doc) => ({
        pageContent: doc.doc,
        metadata: doc.metadata,
      }));

      // Format context with token management
      const contextData = this.contextManager.formatContext(
        conversationHistory,
        formattedDocs
      );

      // Build prompt with context
      const prompt = this.buildPrompt(userMessage, contextData);

      // Generate response using Gemini or fallback
      let response;
      if (this.isGeminiAvailable && this.model) {
        try {
          const result = await this.model.generateContent(prompt);
          response = result.response.text();
        } catch (error) {
          console.error("Error generating AI response:", error);
          this.isGeminiAvailable = false; // Disable Gemini for future requests
          response = this.generateFallbackResponse(userMessage, retrievedDocs);
        }
      } else {
        response = this.generateFallbackResponse(userMessage, retrievedDocs);
      }

      // Extract sources from retrieved documents
      const sources = retrievedDocs.map((doc, index) => ({
        title: doc.metadata?.title || `Document ${index + 1}`,
        url: doc.metadata?.source || "",
        score: doc.score || 0,
        chunk: doc.doc?.substring(0, 200) + "..." || "",
      }));

      // Save context to memory
      await memory.saveContext(
        { input: userMessage },
        {
          output: response,
          sources: sources,
        }
      );

      // Get context statistics
      const stats = this.contextManager.getContextStats(
        conversationHistory,
        formattedDocs
      );

      return {
        response,
        sources,
        sessionId,
        timestamp: new Date(),
        contextStats: stats,
      };
    } catch (error) {
      console.error("Error processing message:", error);
      throw new Error(`Failed to process message: ${error.message}`);
    }
  }

  /**
   * Build prompt with context and conversation history
   */
  buildPrompt(userMessage, contextData) {
    let prompt = `You are a helpful Shopify Merchant Support Agent. Use the provided context and conversation history to answer questions accurately and helpfully.

${contextData.context}

Current question: ${userMessage}

Instructions:
1. Answer based on the provided context and conversation history
2. If you reference information, cite the source numbers [1], [2], etc.
3. Be concise but comprehensive
4. If the context doesn't contain enough information, say so
5. Provide actionable advice when possible

Response:`;

    return prompt;
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId) {
    try {
      const memory = this.initializeMemory(sessionId);
      return await memory.getConversationHistory();
    } catch (error) {
      console.error("Error getting conversation history:", error);
      return [];
    }
  }

  /**
   * Update feedback for a message
   */
  async updateFeedback(sessionId, messageIndex, feedback) {
    try {
      const memory = this.initializeMemory(sessionId);
      await memory.updateFeedback(messageIndex, feedback);
    } catch (error) {
      console.error("Error updating feedback:", error);
      throw new Error(`Failed to update feedback: ${error.message}`);
    }
  }

  /**
   * Clear conversation history for a session
   */
  async clearConversation(sessionId) {
    try {
      const memory = this.initializeMemory(sessionId);
      await memory.clear();
    } catch (error) {
      console.error("Error clearing conversation:", error);
      throw new Error(`Failed to clear conversation: ${error.message}`);
    }
  }

  /**
   * Generate a new session ID
   */
  generateSessionId() {
    return uuidv4();
  }

  /**
   * Generate fallback response when AI is not available
   */
  generateFallbackResponse(userMessage, retrievedDocs) {
    if (retrievedDocs && retrievedDocs.length > 0) {
      // Use retrieved documents to provide helpful information
      const relevantInfo = retrievedDocs
        .slice(0, 3)
        .map((doc, index) => {
          const snippet = doc.doc.substring(0, 200) + "...";
          return `[${index + 1}] ${snippet}`;
        })
        .join("\n\n");

      return `I found some relevant information about your question "${userMessage}":

${relevantInfo}

Please note: I'm currently operating in fallback mode due to API limitations. For more detailed assistance, please ensure your API keys are properly configured.`;
    } else {
      return `I apologize, but I'm currently unable to process your request due to a technical issue with the AI service. However, I can still help you with basic information about Shopify. Please try asking a specific question about Shopify development, APIs, or merchant support, and I'll do my best to provide helpful information based on the available documentation.

Your question: "${userMessage}"`;
    }
  }

  /**
   * Get embedding for text using fallback service
   */
  async getEmbedding(text) {
    try {
      return await embeddingService.getEmbedding(text, { dimension: 768 });
    } catch (error) {
      console.error("Error getting embedding:", error);
      // Return a fallback embedding (zeros) when all methods fail
      console.log("Using zero embedding due to error");
      return new Array(768).fill(0);
    }
  }
}

export default EnhancedChatService;
