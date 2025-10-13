import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/config.js";

/**
 * Query Reformulation Service
 * Reformulates user queries by incorporating context from:
 * 1. Recent conversation (BufferWindowMemory)
 * 2. Long-term memory (PostgreSQL Q&A pairs)
 * 3. Session context and metadata
 * 4. AI-powered query enhancement using Gemini
 */

class QueryReformulationService {
  constructor(bufferMemory, postgresMemory) {
    this.bufferMemory = bufferMemory;
    this.postgresMemory = postgresMemory;
    this.geminiClient = null;
    this.initializeGemini();
  }

  /**
   * Initialize Gemini client for AI-powered query reformulation
   */
  initializeGemini() {
    try {
      if (!config.GEMINI_API_KEY) {
        console.warn(
          "⚠️  GEMINI_API_KEY not found, using rule-based reformulation"
        );
        return;
      }
      this.geminiClient = new GoogleGenerativeAI(config.GEMINI_API_KEY);
      console.log("✅ Gemini client initialized for query reformulation");
    } catch (error) {
      console.warn("⚠️  Failed to initialize Gemini client:", error.message);
    }
  }

  /**
   * Reformulate user query with AI-powered context integration - OPTIMIZED VERSION
   * Accepts pre-fetched context to eliminate redundant database queries
   */
  async reformulateQueryWithContext(
    originalQuery,
    sessionId,
    userId = null,
    preFetchedContext = null
  ) {
    console.log(
      `\n🔄 Reformulating query with Gemini AI (OPTIMIZED): "${originalQuery}"`
    );

    try {
      // Use pre-fetched context to avoid redundant queries
      console.log("📦 Using pre-fetched context");
      const { recentContext, relevantQAs, sessionContext } = preFetchedContext;

      console.log("🔍 Context summary:", {
        recentMessages: recentContext?.messageCount || 0,
        relevantQAs: relevantQAs?.length || 0,
        sessionStats: sessionContext?.stats?.total_messages || 0,
      });

      // Use Gemini AI for intelligent query reformulation
      const reformulatedQuery = await this.reformulateWithGemini(
        originalQuery,
        recentContext,
        relevantQAs,
        sessionContext
      );

      console.log(
        `✅ Query reformulated with AI context integration (OPTIMIZED)\n`
      );
      return {
        originalQuery,
        reformulatedQuery,
        context: {
          recentContext,
          relevantQAs,
          sessionContext,
        },
        method: "gemini_ai_optimized",
      };
    } catch (error) {
      console.error("❌ AI query reformulation failed:", error.message);
      console.log("🔄 Falling back to rule-based reformulation...");

      // Fallback to rule-based reformulation
      const { recentContext, relevantQAs, sessionContext } = preFetchedContext;
      const reformulatedQuery = this.buildReformulatedQuery(
        originalQuery,
        recentContext,
        relevantQAs,
        sessionContext
      );

      return {
        originalQuery,
        reformulatedQuery,
        context: {
          recentContext,
          relevantQAs,
          sessionContext,
        },
        method: "rule_based_fallback",
      };
    }
  }

  /**
   * Reformulate query using Gemini AI with context integration
   */
  async reformulateWithGemini(
    originalQuery,
    recentContext,
    relevantQAs,
    sessionContext
  ) {
    if (!this.geminiClient) {
      throw new Error("Gemini client not initialized");
    }

    // Build context string for Gemini
    let contextString = "";

    // Add recent conversation context - handle both old and new formats
    if (
      recentContext &&
      (recentContext.hasRecentContext || recentContext.messageCount > 0)
    ) {
      contextString += "RECENT CONVERSATION:\n";
      if (recentContext.lastUserMessage) {
        contextString += `Last user question: ${recentContext.lastUserMessage}\n`;
      }
      if (recentContext.lastAssistantMessage) {
        contextString += `Last assistant response: ${recentContext.lastAssistantMessage.substring(
          0,
          200
        )}...\n`;
      }
      contextString += "\n";
    }

    // Add relevant Q&A context - handle both old and new formats
    if (
      relevantQAs &&
      (relevantQAs.hasRelevantQAs ||
        (Array.isArray(relevantQAs) && relevantQAs.length > 0))
    ) {
      contextString += "RELEVANT PREVIOUS DISCUSSIONS:\n";
      const qaPairs = relevantQAs.qaPairs || relevantQAs; // Handle both formats
      qaPairs.slice(0, 2).forEach((qa, index) => {
        contextString += `${index + 1}. Q: ${qa.question}\n`;
        contextString += `   A: ${qa.answer.substring(0, 150)}...\n\n`;
      });
    }

    // Add session context and summary
    if (sessionContext) {
      // Add session metadata
      if (sessionContext.metadata) {
        const project = sessionContext.metadata.project;
        const context = sessionContext.metadata.context;
        if (project || context) {
          contextString += `SESSION CONTEXT: ${
            project ? `Project: ${project}` : ""
          }${context ? `, Context: ${context}` : ""}\n`;
        }
      }

      // Add conversation summary if available
      if (sessionContext.conversationSummary && sessionContext.hasSummary) {
        contextString += `CONVERSATION SUMMARY:\n`;
        contextString += `${sessionContext.conversationSummary.summaryText}\n`;

        if (
          sessionContext.conversationSummary.keyTopics &&
          sessionContext.conversationSummary.keyTopics.length > 0
        ) {
          contextString += `Key Topics: ${sessionContext.conversationSummary.keyTopics.join(
            ", "
          )}\n`;
        }
        contextString += "\n";
      }
    }

    // Create the prompt for Gemini
    const prompt = `You are an expert query reformulation assistant for a Stripe customer support system. Your task is to reformulate user queries to be more effective for document retrieval while maintaining the original intent.

      CONTEXT INFORMATION:
      ${contextString}

      ORIGINAL USER QUERY: "${originalQuery}"

      INSTRUCTIONS:
      1. Reformulate the query to be more specific and search-friendly
      2. Include relevant context from the conversation history
      3. Add technical terms that might help with document retrieval
      4. Maintain the original question's intent
      5. Make the query self-contained for better search results
      6. Focus on Stripe API, payments, webhooks, and technical concepts

      REFORMULATED QUERY:`;

    try {
      const model = this.geminiClient.getGenerativeModel({
        model: "gemini-2.0-flash",
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const reformulatedQuery = response.text().trim();

      // Clean up the response (remove any extra formatting)
      const cleanQuery = reformulatedQuery
        .replace(/^REFORMULATED QUERY:\s*/i, "")
        .trim();

      console.log(
        `\n🤖 Gemini reformulated: "${originalQuery}" → "${cleanQuery}"`
      );
      return cleanQuery;
    } catch (error) {
      console.error("❌ Gemini reformulation failed:", error.message);
      throw error;
    }
  }

  /**
   * Build reformulated query with integrated context
   */
  buildReformulatedQuery(
    originalQuery,
    recentContext,
    relevantQAs,
    sessionContext
  ) {
    let reformulatedQuery = originalQuery;

    // Add recent conversation context if available
    if (recentContext && recentContext.hasRecentContext) {
      const lastUserMessage = recentContext.lastUserMessage;
      const lastAssistantMessage = recentContext.lastAssistantMessage;

      if (lastUserMessage && lastAssistantMessage) {
        // If there's a conversation flow, add context
        reformulatedQuery = `${originalQuery} (In the context of our previous discussion about "${lastUserMessage.substring(
          0,
          100
        )}..." and the response about "${lastAssistantMessage.substring(
          0,
          100
        )}...")`;
      } else if (lastUserMessage) {
        reformulatedQuery = `${originalQuery} (Following up on the previous question about "${lastUserMessage.substring(
          0,
          100
        )}...")`;
      }
    }

    // Add relevant Q&A context if available
    if (relevantQAs && relevantQAs.hasRelevantQAs) {
      const topQA = relevantQAs.qaPairs[0];
      if (topQA && topQA.relevanceScore > 0.6) {
        reformulatedQuery = `${reformulatedQuery} (Related to the previous discussion about "${topQA.question.substring(
          0,
          100
        )}...")`;
      }
    }

    // Add session metadata and summary context if available
    if (sessionContext) {
      // Add session metadata
      if (sessionContext.metadata) {
        const project = sessionContext.metadata.project;
        const context = sessionContext.metadata.context;

        if (project) {
          reformulatedQuery = `${reformulatedQuery} (In the context of ${project} project)`;
        }
        if (context) {
          reformulatedQuery = `${reformulatedQuery} (Specifically for ${context})`;
        }
      }

      // Add conversation summary context
      if (sessionContext.conversationSummary && sessionContext.hasSummary) {
        const summary = sessionContext.conversationSummary.summaryText;
        const keyTopics = sessionContext.conversationSummary.keyTopics;

        if (summary && summary.length > 0) {
          // Extract first sentence or first 100 characters of summary
          const summaryExcerpt =
            summary.split(".")[0] || summary.substring(0, 100);
          reformulatedQuery = `${reformulatedQuery} (Building on previous discussion: ${summaryExcerpt}...)`;
        }

        if (keyTopics && keyTopics.length > 0) {
          reformulatedQuery = `${reformulatedQuery} (Related to topics: ${keyTopics
            .slice(0, 3)
            .join(", ")})`;
        }
      }
    }

    return reformulatedQuery;
  }

  /**
   * Extract Q&A pairs from conversation for long-term memory using Gemini AI
   */
  async extractQAPairs(sessionId, userMessage, assistantResponse) {
    try {
      // Use Gemini AI for intelligent Q&A extraction and analysis
      const analysis = await this.analyzeQAPairWithGemini(
        userMessage,
        assistantResponse
      );

      // Store Q&A pair with AI-enhanced analysis
      const qaPair = await this.postgresMemory.storeQAPair(
        sessionId,
        analysis.question,
        analysis.answer,
        analysis.context,
        analysis.relevanceScore,
        analysis.isImportant,
        analysis.tags
      );

      console.log(
        `🧠 AI-extracted Q&A pair for long-term memory: ${qaPair.qa_id}`
      );
      return qaPair;
    } catch (error) {
      console.error("❌ AI Q&A extraction failed:", error.message);
      console.log("🔄 Falling back to rule-based extraction...");

      // Fallback to rule-based extraction
      return this.extractQAPairsRuleBased(
        sessionId,
        userMessage,
        assistantResponse
      );
    }
  }

  /**
   * Analyze Q&A pair using Gemini AI for better extraction
   */
  async analyzeQAPairWithGemini(userMessage, assistantResponse) {
    if (!this.geminiClient) {
      throw new Error("Gemini client not initialized");
    }

    const prompt = `You are an expert at analyzing customer support conversations for a Stripe API support system. Analyze the following user question and assistant response to extract key information.

USER QUESTION: "${userMessage}"

ASSISTANT RESPONSE: "${assistantResponse}"

Please analyze this conversation and provide:

1. QUESTION: A clean, well-formatted version of the user's question
2. ANSWER: A clean, well-formatted version of the assistant's response
3. CONTEXT: A brief context summary of what was discussed
4. RELEVANCE_SCORE: A score from 0.0 to 1.0 indicating how valuable this Q&A is for future reference
5. IS_IMPORTANT: true/false - whether this Q&A contains important technical information
6. TAGS: An array of relevant tags (e.g., ["payment", "api", "webhook", "error"])

Focus on Stripe API concepts, payment processing, webhooks, errors, and technical implementation details.

Respond in this exact JSON format:
{
  "question": "cleaned question",
  "answer": "cleaned answer", 
  "context": "brief context summary",
  "relevanceScore": 0.8,
  "isImportant": true,
  "tags": ["tag1", "tag2", "tag3"]
}`;

    try {
      const model = this.geminiClient.getGenerativeModel({
        model: "gemini-2.0-flash",
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text().trim();

      // Parse JSON response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in Gemini response");
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validate and clean the analysis
      return {
        question: analysis.question || userMessage,
        answer: analysis.answer || assistantResponse,
        context:
          analysis.context ||
          `User asked: ${userMessage}\nAssistant responded: ${assistantResponse}`,
        relevanceScore: Math.min(
          Math.max(analysis.relevanceScore || 0.5, 0),
          1
        ),
        isImportant: Boolean(analysis.isImportant),
        tags: Array.isArray(analysis.tags) ? analysis.tags : [],
      };
    } catch (error) {
      console.error("❌ Gemini Q&A analysis failed:", error.message);
      throw error;
    }
  }

  /**
   * Fallback rule-based Q&A extraction
   */
  async extractQAPairsRuleBased(sessionId, userMessage, assistantResponse) {
    try {
      const question = userMessage;
      const answer = assistantResponse;

      // Calculate relevance score based on content length and keywords
      const relevanceScore = this.calculateRelevanceScore(question, answer);

      // Determine if this is an important Q&A pair
      const isImportant = this.isImportantQAPair(question, answer);

      // Extract tags from content
      const tags = this.extractTags(question, answer);

      // Store Q&A pair
      const qaPair = await this.postgresMemory.storeQAPair(
        sessionId,
        question,
        answer,
        `User asked: ${question}\nAssistant responded: ${answer}`,
        relevanceScore,
        isImportant,
        tags
      );

      console.log(`🧠 Rule-based extracted Q&A pair: ${qaPair.qa_id}`);
      return qaPair;
    } catch (error) {
      console.error("❌ Failed to extract Q&A pair:", error.message);
      return null;
    }
  }

  /**
   * Calculate relevance score for Q&A pair
   */
  calculateRelevanceScore(question, answer) {
    // Simple scoring based on content characteristics
    let score = 0.5; // Base score

    // Increase score for longer, more detailed answers
    if (answer.length > 200) score += 0.1;
    if (answer.length > 500) score += 0.1;

    // Increase score for technical content
    const technicalKeywords = [
      "api",
      "stripe",
      "payment",
      "webhook",
      "integration",
      "error",
      "code",
    ];
    const technicalCount = technicalKeywords.filter((keyword) =>
      answer.toLowerCase().includes(keyword)
    ).length;
    score += technicalCount * 0.05;

    // Increase score for code examples
    if (answer.includes("```") || answer.includes("code")) {
      score += 0.1;
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Determine if Q&A pair is important
   */
  isImportantQAPair(question, answer) {
    const importantKeywords = [
      "error",
      "bug",
      "issue",
      "problem",
      "how to",
      "tutorial",
      "guide",
    ];
    const hasImportantKeywords = importantKeywords.some(
      (keyword) =>
        question.toLowerCase().includes(keyword) ||
        answer.toLowerCase().includes(keyword)
    );

    const isLongAnswer = answer.length > 300;
    const hasCodeExample = answer.includes("```") || answer.includes("code");

    return hasImportantKeywords || (isLongAnswer && hasCodeExample);
  }

  /**
   * Extract tags from Q&A content
   */
  extractTags(question, answer) {
    const tags = [];

    // Extract from question
    if (question.toLowerCase().includes("payment")) tags.push("payment");
    if (question.toLowerCase().includes("webhook")) tags.push("webhook");
    if (question.toLowerCase().includes("api")) tags.push("api");
    if (question.toLowerCase().includes("error")) tags.push("error");
    if (question.toLowerCase().includes("integration"))
      tags.push("integration");

    // Extract from answer
    if (answer.toLowerCase().includes("stripe")) tags.push("stripe");
    if (answer.toLowerCase().includes("javascript")) tags.push("javascript");
    if (answer.toLowerCase().includes("node")) tags.push("nodejs");
    if (answer.toLowerCase().includes("python")) tags.push("python");

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Get reformulation statistics
   */
  getStats() {
    return {
      bufferMemoryStats: this.bufferMemory.getStats(),
      hasRecentContext: this.bufferMemory.hasRecentContext(),
      messageCount: this.bufferMemory.getRecentMessages().length,
      geminiEnabled: this.geminiClient !== null,
      geminiStatus: this.geminiClient ? "initialized" : "not_available",
    };
  }
}

export default QueryReformulationService;
