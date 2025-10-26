import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB } from "../config/db.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

/**
 * Enhanced Multi-Turn Conversation Manager
 * Handles context management, follow-ups, clarifications, and context compression
 */
export class MultiTurnConversationManager {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    });

    // Context compression settings
    this.COMPRESSION_INTERVAL = 10; // Compress every 10 turns
    this.MAX_CONTEXT_TURNS = 20; // Maximum turns before forced compression

    // Conversation state tracking
    this.conversationStates = new Map(); // sessionId -> state
  }

  /**
   * Extract merchant information from conversation history
   * @param {Array} conversationHistory - Array of message objects
   * @returns {Object} Extracted merchant information
   */
  extractMerchantInfo(conversationHistory) {
    const merchantInfo = {
      planTier: null,
      storeType: null,
      industry: null,
      location: null,
      storeSize: null,
      experienceLevel: null,
    };

    // Keywords to detect merchant plan tiers
    const planTierKeywords = {
      basic: ["basic plan", "basic tier", "basic subscription", "starter plan"],
      shopify: ["shopify plan", "standard plan", "regular plan"],
      advanced: ["advanced plan", "advanced tier", "professional plan"],
      plus: ["shopify plus", "plus plan", "enterprise plan"],
      enterprise: ["enterprise", "custom plan", "white label"],
    };

    // Keywords to detect store types
    const storeTypeKeywords = {
      physical: [
        "physical store",
        "brick and mortar",
        "retail store",
        "in-person",
      ],
      online: ["online store", "ecommerce", "digital store", "web store"],
      both: ["omnichannel", "both online and physical", "multi-channel"],
    };

    // Keywords to detect industries
    const industryKeywords = {
      fashion: ["fashion", "clothing", "apparel", "style", "fashion store"],
      electronics: ["electronics", "tech", "gadgets", "electronics store"],
      food: ["food", "restaurant", "cafe", "bakery", "food store"],
      beauty: ["beauty", "cosmetics", "skincare", "makeup", "beauty store"],
      home: ["home", "furniture", "decor", "home goods"],
      sports: ["sports", "fitness", "athletic", "sports store"],
      books: ["books", "bookstore", "publishing", "literature"],
      jewelry: ["jewelry", "watches", "accessories", "jewelry store"],
    };

    // Keywords to detect store sizes
    const storeSizeKeywords = {
      small: ["small business", "startup", "small store", "local business"],
      medium: ["medium business", "growing business", "mid-size"],
      large: ["large business", "big store", "major retailer"],
      enterprise: ["enterprise", "corporation", "large corporation"],
    };

    // Keywords to detect experience levels
    const experienceKeywords = {
      new: [
        "new to shopify",
        "just started",
        "beginner",
        "new merchant",
        "first time",
      ],
      experienced: [
        "experienced",
        "been using",
        "familiar with",
        "know shopify",
      ],
      expert: ["expert", "advanced user", "power user", "developer"],
    };

    // Analyze conversation history
    const allText = conversationHistory
      .map((msg) => msg.content.toLowerCase())
      .join(" ");

    // Detect plan tier
    for (const [tier, keywords] of Object.entries(planTierKeywords)) {
      if (keywords.some((keyword) => allText.includes(keyword))) {
        merchantInfo.planTier = tier;
        break;
      }
    }

    // Detect store type
    for (const [type, keywords] of Object.entries(storeTypeKeywords)) {
      if (keywords.some((keyword) => allText.includes(keyword))) {
        merchantInfo.storeType = type;
        break;
      }
    }

    // Detect industry
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some((keyword) => allText.includes(keyword))) {
        merchantInfo.industry = industry;
        break;
      }
    }

    // Detect store size
    for (const [size, keywords] of Object.entries(storeSizeKeywords)) {
      if (keywords.some((keyword) => allText.includes(keyword))) {
        merchantInfo.storeSize = size;
        break;
      }
    }

    // Detect experience level
    for (const [level, keywords] of Object.entries(experienceKeywords)) {
      if (keywords.some((keyword) => allText.includes(keyword))) {
        merchantInfo.experienceLevel = level;
        break;
      }
    }

    // Detect location (simple pattern matching)
    const locationPatterns = [
      /(?:in|from|based in|located in)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/g,
      /(?:country|region)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/g,
    ];

    for (const pattern of locationPatterns) {
      const matches = allText.match(pattern);
      if (matches && matches.length > 0) {
        merchantInfo.location = matches[0]
          .replace(/(?:in|from|based in|located in|country|region)\s+/i, "")
          .trim();
        break;
      }
    }

    return merchantInfo;
  }
  async initializeConversationState(sessionId) {
    const state = {
      sessionId,
      turnCount: 0,
      lastCompressionTurn: 0,
      contextSummary: null,
      userPreferences: {
        preferredAPI: null, // 'rest', 'graphql', 'node-sdk'
        technicalLevel: "intermediate", // 'beginner', 'intermediate', 'advanced'
        topics: new Set(), // Track discussed topics
        merchantPlanTier: null, // 'basic', 'shopify', 'advanced', 'plus', 'enterprise'
        storeType: null, // 'physical', 'online', 'both'
        industry: null, // 'fashion', 'electronics', 'food', 'beauty', etc.
        location: null, // Country/region for localized suggestions
        preferredLanguage: "en", // Language preference
        timezone: null, // User's timezone
        storeSize: null, // 'small', 'medium', 'large', 'enterprise'
        experienceLevel: null, // 'new', 'experienced', 'expert'
        goals: new Set(), // Track merchant goals like 'increase_sales', 'optimize_seo', etc.
      },
      conversationFlow: {
        currentTopic: null,
        previousTopics: [],
        followUpContext: null,
      },
      ambiguityFlags: {
        needsClarification: false,
        clarificationQuestion: null,
        pendingClarification: null,
      },
    };

    this.conversationStates.set(sessionId, state);
    return state;
  }

  /**
   * Get or create conversation state
   */
  async getConversationState(sessionId) {
    // First check in-memory cache
    let state = this.conversationStates.get(sessionId);

    if (!state) {
      // Try to load from database
      try {
        const conversation = await Conversation.findOne({ sessionId });
        if (conversation && conversation.conversationState) {
          // Convert from MongoDB document to plain object and restore Set objects
          state = this.restoreStateFromDB(conversation.conversationState);
          // Cache in memory for performance
          this.conversationStates.set(sessionId, state);
          console.log(
            `✅ Loaded conversation state from database for session: ${sessionId}`
          );
        } else {
          // No state exists, create new one
          state = await this.initializeConversationState(sessionId);
        }
      } catch (error) {
        console.error("Error loading conversation state from DB:", error);
        // Fallback to creating new state
        state = await this.initializeConversationState(sessionId);
      }
    }

    return state;
  }

  /**
   * Restore state from database document
   * Converts arrays back to Sets and restores nested structure
   */
  restoreStateFromDB(dbState) {
    const state = JSON.parse(JSON.stringify(dbState));

    // Convert arrays to Sets where needed
    if (state.userPreferences) {
      // Ensure topics is always a Set
      if (Array.isArray(state.userPreferences.topics)) {
        state.userPreferences.topics = new Set(state.userPreferences.topics);
      } else if (!(state.userPreferences.topics instanceof Set)) {
        state.userPreferences.topics = new Set();
      }

      // Ensure goals is always a Set
      if (Array.isArray(state.userPreferences.goals)) {
        state.userPreferences.goals = new Set(state.userPreferences.goals);
      } else if (!(state.userPreferences.goals instanceof Set)) {
        state.userPreferences.goals = new Set();
      }
    }

    return state;
  }

  /**
   * Save conversation state to database
   */
  async saveConversationState(sessionId, state) {
    try {
      // Convert Sets to arrays for database storage
      const dbState = this.prepareStateForDB(state);

      await Conversation.updateOne(
        { sessionId },
        {
          $set: {
            conversationState: dbState,
          },
        }
      );

      console.log(
        `💾 Saved conversation state to database for session: ${sessionId}`
      );
    } catch (error) {
      console.error("Error saving conversation state to DB:", error);
      // Don't throw - in-memory state still works
    }
  }

  /**
   * Prepare state for database storage
   * Converts Sets to arrays for MongoDB
   */
  prepareStateForDB(state) {
    const dbState = JSON.parse(JSON.stringify(state));

    // Convert Sets to arrays
    if (dbState.userPreferences) {
      // Handle topics - ensure it's an array of strings
      if (dbState.userPreferences.topics instanceof Set) {
        dbState.userPreferences.topics = Array.from(
          dbState.userPreferences.topics
        );
      } else if (!Array.isArray(dbState.userPreferences.topics)) {
        dbState.userPreferences.topics = [];
      }

      // Handle goals - ensure it's an array of strings
      if (dbState.userPreferences.goals instanceof Set) {
        dbState.userPreferences.goals = Array.from(
          dbState.userPreferences.goals
        );
      } else if (!Array.isArray(dbState.userPreferences.goals)) {
        dbState.userPreferences.goals = [];
      }

      // Ensure all array items are strings, not objects
      dbState.userPreferences.topics = dbState.userPreferences.topics
        .map((item) => (typeof item === "string" ? item : String(item)))
        .filter(Boolean);
      dbState.userPreferences.goals = dbState.userPreferences.goals
        .map((item) => (typeof item === "string" ? item : String(item)))
        .filter(Boolean);
    }

    return dbState;
  }

  /**
   * Detect if current message is a follow-up question
   */
  async detectFollowUp(currentMessage, conversationHistory) {
    const followUpIndicators = [
      "what about",
      "how about",
      "also",
      "additionally",
      "furthermore",
      "and",
      "but",
      "however",
      "on the other hand",
      "similarly",
      "in addition",
      "moreover",
      "besides",
      "apart from",
      "other than",
      "instead",
      "rather",
      "alternatively",
      "meanwhile",
      "next",
      "then",
      "after that",
      "following",
      "subsequent",
      "related to",
      "concerning",
      "regarding",
      "about",
      "for",
      "with respect to",
    ];

    const message = currentMessage.toLowerCase();

    // Check for explicit follow-up indicators
    const hasFollowUpIndicator = followUpIndicators.some(
      (indicator) =>
        message.startsWith(indicator) || message.includes(` ${indicator} `)
    );

    // Check for pronoun references that suggest continuation
    const pronounReferences = ["it", "this", "that", "these", "those", "them"];
    const hasPronounReference = pronounReferences.some(
      (pronoun) => message.includes(pronoun) && conversationHistory.length > 0
    );

    // Check for question continuation patterns
    const continuationPatterns = [
      /^(and|but|however|also|additionally|furthermore|moreover)\s+/i,
      /^(what|how|when|where|why|which|who)\s+(about|regarding|concerning)/i,
      /^(can|could|would|should)\s+(you|we|i)\s+(also|additionally|further)/i,
    ];

    const hasContinuationPattern = continuationPatterns.some((pattern) =>
      pattern.test(message)
    );

    // Enhanced context-aware follow-up detection
    let contextBasedFollowUp = false;
    let contextConfidence = 0;

    if (conversationHistory.length > 0) {
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      const lastContent = lastMessage.content.toLowerCase();

      // Check if current message is asking about a different aspect of the same topic
      const topicKeywords = this.extractTopicKeywords(lastContent);
      const currentKeywords = this.extractTopicKeywords(message);

      // If there's overlap in keywords but the question is different, it's likely a follow-up
      const keywordOverlap = topicKeywords.filter((keyword) =>
        currentKeywords.includes(keyword)
      ).length;

      if (
        keywordOverlap > 0 &&
        keywordOverlap /
          Math.max(topicKeywords.length, currentKeywords.length) >
          0.3
      ) {
        contextBasedFollowUp = true;
        contextConfidence = Math.min(
          keywordOverlap /
            Math.max(topicKeywords.length, currentKeywords.length),
          0.9
        );
      }

      // Check for API-related follow-ups (e.g., "GraphQL admin api" after "storefront api")
      const apiKeywords = ["api", "rest", "graphql", "storefront", "admin"];
      const hasApiKeywords = apiKeywords.some((keyword) =>
        message.includes(keyword)
      );
      const lastHasApiKeywords = apiKeywords.some((keyword) =>
        lastContent.includes(keyword)
      );

      if (
        hasApiKeywords &&
        lastHasApiKeywords &&
        !message.includes("clarification")
      ) {
        contextBasedFollowUp = true;
        contextConfidence = Math.max(contextConfidence, 0.8);
      }
    }

    return {
      isFollowUp:
        hasFollowUpIndicator ||
        hasPronounReference ||
        hasContinuationPattern ||
        contextBasedFollowUp,
      confidence: Math.max(
        (hasFollowUpIndicator ? 0.8 : 0) +
          (hasPronounReference ? 0.6 : 0) +
          (hasContinuationPattern ? 0.7 : 0),
        contextConfidence
      ),
      indicators: {
        followUpWords: hasFollowUpIndicator,
        pronounReference: hasPronounReference,
        continuationPattern: hasContinuationPattern,
        contextBased: contextBasedFollowUp,
      },
    };
  }

  /**
   * Extract topic keywords from a message
   */
  extractTopicKeywords(message) {
    const stopWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "this",
      "that",
      "these",
      "those",
    ];

    return message
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10); // Limit to most relevant keywords
  }

  /**
   * Detect ambiguous questions that need clarification
   */
  async detectAmbiguity(message, conversationHistory) {
    // Skip ambiguity detection for clarified queries (they already have clarification)
    if (message.includes("(Clarification:")) {
      return {
        needsClarification: false,
        ambiguities: [],
        clarificationQuestion: null,
      };
    }
    const ambiguityPatterns = [
      // API ambiguity - only when asking about API differences or comparisons
      {
        pattern:
          /\b(which.*api|what.*api|api.*difference|compare.*api|api.*vs|rest.*vs.*graphql|graphql.*vs.*rest)\b/i,
        clarification:
          "Are you asking about the REST Admin API, GraphQL Admin API, or Storefront API?",
        context: "api_type",
      },
      // Payment ambiguity - only when asking about payment integration/setup
      {
        pattern:
          /\b(payment.*integrat|integrat.*payment|payment.*setup|setup.*payment)\b/i,
        clarification:
          "Are you asking about one-time payments, recurring payments, or payment processing setup?",
        context: "payment_type",
      },
      // Integration ambiguity - only when asking about integration
      {
        pattern: /\b(integrat.*service|connect.*app|link.*account)\b/i,
        clarification:
          "Are you asking about integrating with external services, connecting apps, or linking accounts?",
        context: "integration_type",
      },
      // Development ambiguity - only when asking about development
      {
        pattern: /\b(develop.*app|build.*app|create.*app)\b/i,
        clarification:
          "Are you asking about building a Shopify app, customizing themes, or developing integrations?",
        context: "development_type",
      },
      // Store setup ambiguity - only when asking about setup
      {
        pattern: /\b(setup.*store|configure.*store|install.*app)\b/i,
        clarification:
          "Are you asking about store setup, app installation, or configuration?",
        context: "setup_type",
      },
    ];

    const detectedAmbiguities = [];

    for (const ambiguity of ambiguityPatterns) {
      if (ambiguity.pattern.test(message)) {
        detectedAmbiguities.push({
          type: ambiguity.context,
          clarification: ambiguity.clarification,
          confidence: 0.8,
        });
      }
    }

    return {
      needsClarification: detectedAmbiguities.length > 0,
      ambiguities: detectedAmbiguities,
      clarificationQuestion:
        detectedAmbiguities.length > 0
          ? detectedAmbiguities[0].clarification
          : null,
    };
  }

  /**
   * Extract user preferences from conversation
   */
  async extractUserPreferences(message, conversationHistory) {
    const preferences = {
      preferredAPI: null,
      technicalLevel: "intermediate",
      topics: new Set(),
    };

    // Detect API preference
    if (/rest.*api|admin.*api/i.test(message)) {
      preferences.preferredAPI = "rest";
    } else if (/graphql|gql/i.test(message)) {
      preferences.preferredAPI = "graphql";
    } else if (/node.*sdk|javascript.*sdk/i.test(message)) {
      preferences.preferredAPI = "node-sdk";
    }

    // Detect technical level
    if (/beginner|basic|simple|easy/i.test(message)) {
      preferences.technicalLevel = "beginner";
    } else if (/advanced|complex|sophisticated|expert/i.test(message)) {
      preferences.technicalLevel = "advanced";
    }

    // Extract topics
    const topicKeywords = {
      products: /product|inventory|catalog/i,
      orders: /order|fulfillment|shipping/i,
      customers: /customer|user|client/i,
      payments: /payment|billing|charge/i,
      themes: /theme|design|template/i,
      apps: /app|application|integration/i,
      analytics: /analytics|report|data/i,
      settings: /setting|configuration|setup/i,
    };

    for (const [topic, pattern] of Object.entries(topicKeywords)) {
      if (pattern.test(message)) {
        preferences.topics.add(topic);
      }
    }

    return preferences;
  }

  /**
   * Compress conversation context using GPT-4
   */
  async compressConversationContext(conversationHistory, currentState) {
    try {
      // Get recent messages for compression
      const recentMessages = conversationHistory.slice(
        -this.COMPRESSION_INTERVAL
      );

      const compressionPrompt = `You are a conversation summarizer. Compress the following conversation history into a concise summary that preserves:
1. Key topics discussed
2. User's preferences and technical level
3. Important context for future questions
4. Any unresolved questions or follow-ups

Conversation History:
${recentMessages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

Current User Preferences:
- Preferred API: ${currentState.userPreferences.preferredAPI || "Not specified"}
- Technical Level: ${currentState.userPreferences.technicalLevel}
- Topics Discussed: ${
        Array.from(currentState.userPreferences.topics).join(", ") || "None"
      }

Provide a concise summary (max 200 words) that maintains context for future questions:`;

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: compressionPrompt }] }],
      });

      const summary = result.response?.text() || "No summary generated.";

      return {
        summary,
        compressedAt: new Date(),
        originalTurnCount: recentMessages.length,
      };
    } catch (error) {
      console.error("Error compressing conversation context:", error);
      return {
        summary:
          "Context compression failed. Using recent conversation history.",
        compressedAt: new Date(),
        originalTurnCount: conversationHistory.length,
      };
    }
  }

  /**
   * Build enhanced context for the current message
   */
  async buildEnhancedContext(
    message,
    sessionId,
    conversationHistory,
    searchResults
  ) {
    const state = await this.getConversationState(sessionId);

    // Update turn count
    state.turnCount++;

    // Detect follow-up
    const followUpDetection = await this.detectFollowUp(
      message,
      conversationHistory
    );

    // Detect ambiguity
    const ambiguityDetection = await this.detectAmbiguity(
      message,
      conversationHistory
    );

    // Extract user preferences
    const newPreferences = await this.extractUserPreferences(
      message,
      conversationHistory
    );

    // Extract merchant information from conversation history
    const merchantInfo = this.extractMerchantInfo(conversationHistory);

    // Update user preferences
    if (newPreferences.preferredAPI) {
      state.userPreferences.preferredAPI = newPreferences.preferredAPI;
    }
    if (newPreferences.technicalLevel !== "intermediate") {
      state.userPreferences.technicalLevel = newPreferences.technicalLevel;
    }
    newPreferences.topics.forEach((topic) =>
      state.userPreferences.topics.add(topic)
    );

    // Update merchant information
    if (merchantInfo.planTier) {
      state.userPreferences.merchantPlanTier = merchantInfo.planTier;
    }
    if (merchantInfo.storeType) {
      state.userPreferences.storeType = merchantInfo.storeType;
    }
    if (merchantInfo.industry) {
      state.userPreferences.industry = merchantInfo.industry;
    }
    if (merchantInfo.location) {
      state.userPreferences.location = merchantInfo.location;
    }
    if (merchantInfo.storeSize) {
      state.userPreferences.storeSize = merchantInfo.storeSize;
    }
    if (merchantInfo.experienceLevel) {
      state.userPreferences.experienceLevel = merchantInfo.experienceLevel;
    }

    // Check if compression is needed
    const turnsSinceCompression = state.turnCount - state.lastCompressionTurn;
    let contextSummary = state.contextSummary;

    if (
      turnsSinceCompression >= this.COMPRESSION_INTERVAL ||
      state.turnCount >= this.MAX_CONTEXT_TURNS
    ) {
      console.log(
        `Compressing conversation context at turn ${state.turnCount}`
      );
      const compressionResult = await this.compressConversationContext(
        conversationHistory,
        state
      );

      contextSummary = compressionResult.summary;
      state.contextSummary = contextSummary;
      state.lastCompressionTurn = state.turnCount;
    }

    // Build contextual query
    let contextualQuery = message;

    if (followUpDetection.isFollowUp) {
      // Add follow-up context
      const recentContext = conversationHistory
        .slice(-3)
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");
      contextualQuery = `Previous context: ${recentContext}\n\nFollow-up question: ${message}`;
    }

    if (contextSummary) {
      contextualQuery = `Conversation summary: ${contextSummary}\n\nCurrent question: ${message}`;
    }

    // Add user preferences to context
    if (state.userPreferences.preferredAPI) {
      contextualQuery += `\n\nUser prefers: ${state.userPreferences.preferredAPI} API`;
    }

    // Save state to database after updates
    await this.saveConversationState(sessionId, state);

    return {
      contextualQuery,
      conversationState: state,
      followUpDetection,
      ambiguityDetection,
      needsClarification: ambiguityDetection.needsClarification,
      clarificationQuestion: ambiguityDetection.clarificationQuestion,
    };
  }

  /**
   * Process clarification response
   */
  async processClarificationResponse(
    clarificationResponse,
    originalQuestion,
    sessionId
  ) {
    const state = await this.getConversationState(sessionId);

    // Clear ambiguity flags
    state.ambiguityFlags.needsClarification = false;
    state.ambiguityFlags.clarificationQuestion = null;
    state.ambiguityFlags.pendingClarification = originalQuestion;

    // Build clarified query
    const clarifiedQuery = `${originalQuestion} (Clarification: ${clarificationResponse})`;

    // Save updated state to database
    await this.saveConversationState(sessionId, state);

    return {
      clarifiedQuery,
      conversationState: state,
    };
  }

  /**
   * Generate enhanced response with multi-turn context
   */
  async generateEnhancedResponse(
    message,
    sessionId,
    conversationHistory,
    searchResults,
    intentSpecificPrompt = null
  ) {
    const enhancedContext = await this.buildEnhancedContext(
      message,
      sessionId,
      conversationHistory,
      searchResults
    );

    const {
      contextualQuery,
      conversationState,
      followUpDetection,
      ambiguityDetection,
      needsClarification,
      clarificationQuestion,
    } = enhancedContext;

    // If clarification is needed, return clarification request
    if (needsClarification) {
      return {
        answer: clarificationQuestion,
        needsClarification: true,
        conversationState,
        followUpDetection,
        ambiguityDetection,
      };
    }

    // Build enhanced prompt with multi-turn context and intent-specific guidance
    const systemPrompt =
      intentSpecificPrompt ||
      `You are an expert Shopify Merchant Support Assistant with deep knowledge of Shopify's platform, APIs, and best practices.

CONVERSATION CONTEXT:
- Turn Count: ${conversationState.turnCount}
- User's Preferred API: ${
        conversationState.userPreferences.preferredAPI || "Not specified"
      }
- User's Technical Level: ${conversationState.userPreferences.technicalLevel}
- Topics Discussed: ${
        Array.from(conversationState.userPreferences.topics).join(", ") ||
        "None"
      }
- Is Follow-up Question: ${followUpDetection.isFollowUp ? "Yes" : "No"}

INSTRUCTIONS:
1. **Maintain Context**: Reference previous conversation when relevant
2. **Follow-up Handling**: If this is a follow-up, build upon previous answers
3. **User Preferences**: Adapt your response to the user's technical level and API preference
4. **Continuity**: Use "As mentioned earlier..." or "Building on your previous question..." when appropriate
5. **Comprehensive Answers**: Provide detailed, actionable responses
6. **Format Clearly**: Use markdown formatting for better readability

RESPONSE GUIDELINES:
- For follow-up questions: Acknowledge the connection to previous topics
- For API questions: Include examples using the user's preferred API when known
- For technical questions: Match the user's technical level
- For new topics: Provide comprehensive overviews with practical applications`;

    const context = searchResults
      .map(
        (r, i) =>
          `[Source ${i + 1}] ${r.metadata?.title || "Unknown"} (${
            r.metadata?.source_url || "N/A"
          })\n${r.doc}`
      )
      .join("\n\n---\n\n");

    const conversationHistoryText =
      conversationHistory.length > 0
        ? conversationHistory
            .slice(-6)
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join("\n")
        : "";

    const prompt = `${systemPrompt}

${
  conversationHistoryText
    ? `RECENT CONVERSATION:\n${conversationHistoryText}\n`
    : ""
}

RETRIEVED DOCUMENTATION:
${context}

USER QUESTION: ${contextualQuery}

EXPERT ANSWER:`;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const answer = result.response?.text() || "No response generated.";

      return {
        answer,
        conversationState,
        followUpDetection,
        ambiguityDetection,
        needsClarification: false,
        contextualQuery,
      };
    } catch (error) {
      console.error("Error generating enhanced response:", error);
      throw error;
    }
  }

  /**
   * Clean up conversation state (for memory management)
   */
  cleanupConversationState(sessionId) {
    this.conversationStates.delete(sessionId);
  }

  /**
   * Get conversation statistics
   */
  getConversationStats(sessionId) {
    const state = this.conversationStates.get(sessionId);
    if (!state) return null;

    return {
      turnCount: state.turnCount,
      lastCompressionTurn: state.lastCompressionTurn,
      hasContextSummary: !!state.contextSummary,
      userPreferences: state.userPreferences,
      conversationFlow: state.conversationFlow,
    };
  }
}

// Export singleton instance
export const multiTurnManager = new MultiTurnConversationManager();
