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
import { multiTurnManager } from "../src/multi-turn-conversation.js";
import IntentClassificationService from "../src/services/intentClassificationService.js";
import ProactiveSuggestionsService from "../src/services/proactiveSuggestionsService.js";
import { AnalyticsService } from "../src/services/analyticsService.js";

// Initialize markdown renderer
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// Enhanced confidence scoring function
function calculateConfidence(
  results,
  answer,
  query = "",
  intentClassification = null
) {
  if (!results || results.length === 0) {
    return {
      score: 10,
      level: "Very Low",
      factors: ["No sources found"],
    };
  }

  let confidence = 0;
  let confidenceFactors = [];

  // Enhanced Factor 1: Cross-encoder re-ranking simulation (30% weight)
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const queryAnswerRelevance = calculateQueryAnswerRelevance(query, answer);
  const crossEncoderScore = avgScore * 0.7 + queryAnswerRelevance * 0.3;

  if (crossEncoderScore >= 0.8) {
    confidence += 30;
    confidenceFactors.push("Very high cross-encoder relevance");
  } else if (crossEncoderScore >= 0.6) {
    confidence += 25;
    confidenceFactors.push("High cross-encoder relevance");
  } else if (crossEncoderScore >= 0.4) {
    confidence += 20;
    confidenceFactors.push("Good cross-encoder relevance");
  } else if (crossEncoderScore >= 0.2) {
    confidence += 15;
    confidenceFactors.push("Moderate cross-encoder relevance");
  } else {
    confidence += 10;
    confidenceFactors.push("Low cross-encoder relevance");
  }

  // Enhanced Factor 2: Exact entity matching bonus (25% weight)
  const entityMatchBonus = calculateEntityMatchBonus(query, answer, results);
  confidence += entityMatchBonus * 25;
  if (entityMatchBonus > 0.5) {
    confidenceFactors.push("Strong exact entity matches found");
  } else if (entityMatchBonus > 0.2) {
    confidenceFactors.push("Some exact entity matches found");
  }

  // Enhanced Factor 3: Source quality and diversity (20% weight)
  const sourceQualityBonus = calculateSourceQualityBonus(results);
  const searchTypes = [...new Set(results.map((r) => r.searchType))];
  const categories = [
    ...new Set(results.map((r) => r.metadata?.category || "unknown")),
  ];

  let sourceScore = 0;
  if (searchTypes.length >= 3) {
    sourceScore += 10;
    confidenceFactors.push("Multiple search methods used");
  } else if (searchTypes.length >= 2) {
    sourceScore += 8;
    confidenceFactors.push("Hybrid search methods used");
  } else {
    sourceScore += 5;
    confidenceFactors.push("Single search method used");
  }

  if (categories.length >= 4) {
    sourceScore += 10;
    confidenceFactors.push("High category diversity");
  } else if (categories.length >= 2) {
    sourceScore += 5;
    confidenceFactors.push("Good category diversity");
  }

  confidence += sourceScore + sourceQualityBonus * 100;

  // Enhanced Factor 4: Answer completeness and quality (15% weight)
  const completenessBonus = calculateAnswerCompleteness(query, answer);
  const answerLength = answer.length;
  const hasCodeBlocks = answer.includes("```") || answer.includes("`");
  const hasSpecifics =
    answer.includes("API") ||
    answer.includes("endpoint") ||
    answer.includes("parameter");
  const hasExamples =
    answer.includes("example") || answer.includes("for instance");
  const hasSteps =
    answer.includes("1.") || answer.includes("2.") || answer.includes("Step");

  let answerScore = 0;
  if (answerLength > 500 && hasSpecifics && (hasExamples || hasSteps)) {
    answerScore += 15;
    confidenceFactors.push("Comprehensive answer with details and examples");
  } else if (answerLength > 300 && (hasSpecifics || hasCodeBlocks)) {
    answerScore += 12;
    confidenceFactors.push("Detailed technical answer");
  } else if (answerLength > 200 && (hasExamples || hasSteps)) {
    answerScore += 10;
    confidenceFactors.push("Good practical guidance");
  } else if (answerLength > 100) {
    answerScore += 7;
    confidenceFactors.push("Basic answer provided");
  } else {
    answerScore += 3;
    confidenceFactors.push("Minimal answer");
  }

  confidence += answerScore + completenessBonus * 100;

  // Enhanced Factor 5: Intent classification confidence (10% weight)
  if (intentClassification && intentClassification.confidence) {
    const intentConfidence = intentClassification.confidence * 10;
    confidence += intentConfidence;
    if (intentConfidence > 8) {
      confidenceFactors.push("High intent classification confidence");
    } else if (intentConfidence > 6) {
      confidenceFactors.push("Good intent classification confidence");
    }
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

/**
 * Calculate query-answer relevance using keyword matching and semantic similarity
 * @param {string} query - User query
 * @param {string} answer - Generated answer
 * @returns {number} Relevance score (0-1)
 */
function calculateQueryAnswerRelevance(query, answer) {
  if (!query || !answer) return 0;

  const queryLower = query.toLowerCase();
  const answerLower = answer.toLowerCase();

  // Extract key terms from query
  const queryTerms = queryLower
    .split(/\s+/)
    .filter(
      (term) =>
        term.length > 2 &&
        ![
          "the",
          "and",
          "or",
          "but",
          "for",
          "with",
          "how",
          "what",
          "when",
          "where",
          "why",
        ].includes(term)
    );

  // Check how many query terms appear in the answer
  const matchingTerms = queryTerms.filter((term) => answerLower.includes(term));
  const termMatchRatio =
    queryTerms.length > 0 ? matchingTerms.length / queryTerms.length : 0;

  // Check for specific Shopify-related terms
  const shopifyTerms = [
    "shopify",
    "store",
    "product",
    "order",
    "payment",
    "shipping",
    "theme",
    "app",
    "api",
    "webhook",
  ];
  const shopifyMatches = shopifyTerms.filter(
    (term) => queryLower.includes(term) && answerLower.includes(term)
  );
  const shopifyMatchRatio =
    shopifyTerms.length > 0 ? shopifyMatches.length / shopifyTerms.length : 0;

  // Combine term matching and Shopify-specific matching
  return termMatchRatio * 0.7 + shopifyMatchRatio * 0.3;
}

/**
 * Calculate entity matching bonus for exact matches
 * @param {string} query - User query
 * @param {string} answer - Generated answer
 * @param {Array} results - Search results
 * @returns {number} Entity match bonus (0-1)
 */
function calculateEntityMatchBonus(query, answer, results) {
  if (!query || !answer) return 0;

  let bonus = 0;

  // Check for exact API method matches
  const apiMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
  const apiMethodMatches = apiMethods.filter(
    (method) => query.includes(method) && answer.includes(method)
  );
  bonus += apiMethodMatches.length * 0.1;

  // Check for exact error code matches
  const errorCodePattern = /\b\d{3}\b/g;
  const queryErrorCodes = query.match(errorCodePattern) || [];
  const answerErrorCodes = answer.match(errorCodePattern) || [];
  const errorCodeMatches = queryErrorCodes.filter((code) =>
    answerErrorCodes.includes(code)
  );
  bonus += errorCodeMatches.length * 0.15;

  // Check for exact Shopify entity matches
  const shopifyEntities = [
    "product",
    "order",
    "customer",
    "collection",
    "variant",
    "inventory",
    "fulfillment",
  ];
  const entityMatches = shopifyEntities.filter(
    (entity) =>
      query.toLowerCase().includes(entity) &&
      answer.toLowerCase().includes(entity)
  );
  bonus += entityMatches.length * 0.1;

  // Check for exact URL/endpoint matches
  const urlPattern = /https?:\/\/[^\s]+/g;
  const queryUrls = query.match(urlPattern) || [];
  const answerUrls = answer.match(urlPattern) || [];
  const urlMatches = queryUrls.filter((url) => answerUrls.includes(url));
  bonus += urlMatches.length * 0.2;

  // Check for exact code snippet matches
  const codePattern = /`[^`]+`/g;
  const queryCode = query.match(codePattern) || [];
  const answerCode = answer.match(codePattern) || [];
  const codeMatches = queryCode.filter((code) => answerCode.includes(code));
  bonus += codeMatches.length * 0.15;

  return Math.min(bonus, 1.0);
}

/**
 * Calculate source quality bonus based on result metadata
 * @param {Array} results - Search results
 * @returns {number} Source quality bonus (0-1)
 */
function calculateSourceQualityBonus(results) {
  if (!results || results.length === 0) return 0;

  let qualityScore = 0;
  const totalResults = results.length;

  // Weight different source types
  const sourceWeights = {
    api_admin_graphql: 1.0,
    api_admin_rest: 1.0,
    api_storefront: 0.9,
    shopify_dev: 0.9,
    helpcenter: 0.8,
    manual_getting_started: 0.8,
    manual_products: 0.8,
    manual_orders: 0.8,
    theme: 0.7,
    theme_liquid: 0.7,
    forum: 0.6,
    getting_started: 0.6,
  };

  results.forEach((result) => {
    const sourceType = result.metadata?.category || "unknown";
    const weight = sourceWeights[sourceType] || 0.5;
    qualityScore += weight;
  });

  return (qualityScore / totalResults) * 0.1; // Scale to 0-0.1 range
}

/**
 * Calculate answer completeness bonus
 * @param {string} query - User query
 * @param {string} answer - Generated answer
 * @returns {number} Completeness bonus (0-1)
 */
function calculateAnswerCompleteness(query, answer) {
  if (!query || !answer) return 0;

  let completeness = 0;

  // Check if answer addresses the main question
  const questionWords = ["what", "how", "when", "where", "why", "which", "who"];
  const hasQuestionWord = questionWords.some((word) =>
    query.toLowerCase().includes(word)
  );

  if (hasQuestionWord) {
    // Check if answer provides a direct response
    const answerLength = answer.length;
    if (answerLength > 100) completeness += 0.3;
    if (answerLength > 300) completeness += 0.2;
    if (answerLength > 500) completeness += 0.1;
  }

  // Check for code examples in technical queries
  if (
    query.toLowerCase().includes("code") ||
    query.toLowerCase().includes("example")
  ) {
    if (answer.includes("```") || answer.includes("`")) {
      completeness += 0.2;
    }
  }

  // Check for step-by-step instructions
  if (
    query.toLowerCase().includes("step") ||
    query.toLowerCase().includes("how to")
  ) {
    const stepPattern = /\d+\.|step \d+|first|second|third|next|then|finally/i;
    if (stepPattern.test(answer)) {
      completeness += 0.2;
    }
  }

  // Check for links to additional resources
  if (answer.includes("http") || answer.includes("https")) {
    completeness += 0.1;
  }

  return Math.min(completeness, 0.1); // Cap at 0.1
}

// Smart query classifier to determine routing strategy
function classifyQueryType(query) {
  const queryLower = query.toLowerCase();

  // General knowledge query patterns
  const generalKnowledgePatterns = [
    /^(who is|what is|when was|where is|why is|how does|tell me about|explain|describe|define)/i,
    /^(who are|what are|when are|where are|why are|how are)/i,
    /^(who was|what was|when was|where was|why was|how was)/i,
    /^(who were|what were|when were|where were|why were|how were)/i,
    /^(who will|what will|when will|where will|why will|how will)/i,
    /^(who can|what can|when can|where can|why can|how can)/i,
    /^(who should|what should|when should|where should|why should|how should)/i,
    /^(who would|what would|when would|where would|why would|how would)/i,
    /^(who could|what could|when could|where could|why could|how could)/i,
    /^(who might|what might|when might|where might|why might|how might)/i,
    /^(who may|what may|when may|where may|why may|how may)/i,
    /^(who must|what must|when must|where must|why must|how must)/i,
    /^(who shall|what shall|when shall|where shall|why shall|how shall)/i,
    /^(who ought|what ought|when ought|where ought|why ought|how ought)/i,
    /^(who need|what need|when need|where need|why need|how need)/i,
    /^(who dare|what dare|when dare|where dare|why dare|how dare)/i,
    /^(who used|what used|when used|where used|why used|how used)/i,
    /^(who used to|what used to|when used to|where used to|why used to|how used to)/i,
    /^(who going to|what going to|when going to|where going to|why going to|how going to)/i,
    /^(who about to|what about to|when about to|where about to|why about to|how about to)/i,
    /^(who supposed to|what supposed to|when supposed to|where supposed to|why supposed to|how supposed to)/i,
    /^(who meant to|what meant to|when meant to|where meant to|why meant to|how meant to)/i,
    /^(who intended to|what intended to|when intended to|where intended to|why intended to|how intended to)/i,
    /^(who planning to|what planning to|when planning to|where planning to|why planning to|how planning to)/i,
    /^(who trying to|what trying to|when trying to|where trying to|why trying to|how trying to)/i,
    /^(who attempting to|what attempting to|when attempting to|where attempting to|why attempting to|how attempting to)/i,
    /^(who working on|what working on|when working on|where working on|why working on|how working on)/i,
    /^(who developing|what developing|when developing|where developing|why developing|how developing)/i,
    /^(who building|what building|when building|where building|why building|how building)/i,
    /^(who creating|what creating|when creating|where creating|why creating|how creating)/i,
    /^(who making|what making|when making|where making|why making|how making)/i,
    /^(who designing|what designing|when designing|where designing|why designing|how designing)/i,
    /^(who constructing|what constructing|when constructing|where constructing|why constructing|how constructing)/i,
    /^(who assembling|what assembling|when assembling|where assembling|why assembling|how assembling)/i,
    /^(who putting together|what putting together|when putting together|where putting together|why putting together|how putting together)/i,
    /^(who setting up|what setting up|when setting up|where setting up|why setting up|how setting up)/i,
    /^(who installing|what installing|when installing|where installing|why installing|how installing)/i,
    /^(who configuring|what configuring|when configuring|where configuring|why configuring|how configuring)/i,
    /^(who customizing|what customizing|when customizing|where customizing|why customizing|how customizing)/i,
    /^(who personalizing|what personalizing|when personalizing|where personalizing|why personalizing|how personalizing)/i,
    /^(who tailoring|what tailoring|when tailoring|where tailoring|why tailoring|how tailoring)/i,
    /^(who adapting|what adapting|when adapting|where adapting|why adapting|how adapting)/i,
    /^(who modifying|what modifying|when modifying|where modifying|why modifying|how modifying)/i,
    /^(who adjusting|what adjusting|when adjusting|where adjusting|why adjusting|how adjusting)/i,
    /^(who tuning|what tuning|when tuning|where tuning|why tuning|how tuning)/i,
    /^(who optimizing|what optimizing|when optimizing|where optimizing|why optimizing|how optimizing)/i,
    /^(who improving|what improving|when improving|where improving|why improving|how improving)/i,
    /^(who enhancing|what enhancing|when enhancing|where enhancing|why enhancing|how enhancing)/i,
    /^(who upgrading|what upgrading|when upgrading|where upgrading|why upgrading|how upgrading)/i,
    /^(who updating|what updating|when updating|where updating|why updating|how updating)/i,
    /^(who refreshing|what refreshing|when refreshing|where refreshing|why refreshing|how refreshing)/i,
    /^(who renewing|what renewing|when renewing|where renewing|why renewing|how renewing)/i,
    /^(who restoring|what restoring|when restoring|where restoring|why restoring|how restoring)/i,
    /^(who resetting|what resetting|when resetting|where resetting|why resetting|how resetting)/i,
    /^(who rebuilding|what rebuilding|when rebuilding|where rebuilding|why rebuilding|how rebuilding)/i,
    /^(who reconstructing|what reconstructing|when reconstructing|where reconstructing|why reconstructing|how reconstructing)/i,
    /^(who reassembling|what reassembling|when reassembling|where reassembling|why reassembling|how reassembling)/i,
    /^(who reinstalling|what reinstalling|when reinstalling|where reinstalling|why reinstalling|how reinstalling)/i,
    /^(who reconfiguring|what reconfiguring|when reconfiguring|where reconfiguring|why reconfiguring|how reconfiguring)/i,
    /^(who recustomizing|what recustomizing|when recustomizing|where recustomizing|why recustomizing|how recustomizing)/i,
    /^(who repersonalizing|what repersonalizing|when repersonalizing|where repersonalizing|why repersonalizing|how repersonalizing)/i,
    /^(who retailoring|what retailoring|when retailoring|where retailoring|why retailoring|how retailoring)/i,
    /^(who readapting|what readapting|when readapting|where readapting|why readapting|how readapting)/i,
    /^(who remodifying|what remodifying|when remodifying|where remodifying|why remodifying|how remodifying)/i,
    /^(who readjusting|what readjusting|when readjusting|where readjusting|why readjusting|how readjusting)/i,
    /^(who retuning|what retuning|when retuning|where retuning|why retuning|how retuning)/i,
    /^(who reoptimizing|what reoptimizing|when reoptimizing|where reoptimizing|why reoptimizing|how reoptimizing)/i,
    /^(who reimproving|what reimproving|when reimproving|where reimproving|why reimproving|how reimproving)/i,
    /^(who reenhancing|what reenhancing|when reenhancing|where reenhancing|why reenhancing|how reenhancing)/i,
    /^(who reupgrading|what reupgrading|when reupgrading|where reupgrading|why reupgrading|how reupgrading)/i,
    /^(who reupdating|what reupdating|when reupdating|where reupdating|why reupdating|how reupdating)/i,
    /^(who refreshing|what refreshing|when refreshing|where refreshing|why refreshing|how refreshing)/i,
    /^(who renewing|what renewing|when renewing|where renewing|why renewing|how renewing)/i,
    /^(who restoring|what restoring|when restoring|where restoring|why restoring|how restoring)/i,
    /^(who resetting|what resetting|when resetting|where resetting|why resetting|how resetting)/i,
  ];

  // Check if it's a general knowledge query
  const isGeneralKnowledgeQuery = generalKnowledgePatterns.some((pattern) =>
    pattern.test(query)
  );

  // Check if it's NOT Shopify-related
  const shopifyKeywords = [
    "shopify",
    "store",
    "ecommerce",
    "merchant",
    "product",
    "order",
    "customer",
    "payment",
    "shipping",
    "theme",
    "app",
    "api",
    "webhook",
    "checkout",
    "cart",
    "inventory",
    "fulfillment",
    "collection",
    "variant",
    "admin",
    "dashboard",
    "analytics",
    "reports",
    "settings",
    "configuration",
    "customization",
    "liquid",
    "template",
    "layout",
    "section",
    "block",
    "component",
  ];

  const isNotShopifyRelated = !shopifyKeywords.some((keyword) =>
    queryLower.includes(keyword)
  );

  // Mathematical query patterns
  const mathPatterns = [
    /\d+\s*[\+\-\*\/]\s*\d+/,
    /calculate|computation|math|arithmetic|equation|formula|solve/,
    /plus|minus|times|divided|multiply|add|subtract|sum|total|equals/,
  ];
  const isMathQuery = mathPatterns.some((pattern) => pattern.test(queryLower));

  // Date/time query patterns
  const dateTimePatterns = [
    /what time|current time|now|today|yesterday|tomorrow|date|calendar/,
    /timezone|clock|schedule|appointment|meeting|event/,
  ];
  const isDateTimeQuery = dateTimePatterns.some((pattern) =>
    pattern.test(queryLower)
  );

  // Code validation query patterns
  const codePatterns = [
    /validate|check|syntax|error|bug|debug|code|javascript|html|css|liquid/,
    /function|variable|class|method|api|endpoint/,
  ];
  const isCodeQuery = codePatterns.some((pattern) => pattern.test(queryLower));

  // Currency conversion query patterns
  const currencyPatterns = [
    /convert|exchange|currency|dollar|euro|pound|yen|rupee|peso|franc/,
    /usd|eur|gbp|jpy|inr|mxn|chf|cad|aud/,
  ];
  const isCurrencyQuery = currencyPatterns.some((pattern) =>
    pattern.test(queryLower)
  );

  return {
    isGeneralKnowledgeQuery,
    isNotShopifyRelated,
    isMathQuery,
    isDateTimeQuery,
    isCodeQuery,
    isCurrencyQuery,
    shouldUseWebSearch: isGeneralKnowledgeQuery && isNotShopifyRelated,
    shouldUseMCPTools:
      isMathQuery || isDateTimeQuery || isCodeQuery || isCurrencyQuery,
    shouldUseRAG: !isGeneralKnowledgeQuery || !isNotShopifyRelated,
    queryType:
      isGeneralKnowledgeQuery && isNotShopifyRelated
        ? "general_knowledge"
        : isMathQuery
        ? "mathematical"
        : isDateTimeQuery
        ? "date_time"
        : isCodeQuery
        ? "code_validation"
        : isCurrencyQuery
        ? "currency_conversion"
        : "shopify_related",
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
let intentClassifier = null;
let proactiveSuggestions = null;
let analyticsService = null;

async function initializeAI() {
  if (
    retriever &&
    model &&
    mcpOrchestrator &&
    intentClassifier &&
    proactiveSuggestions &&
    analyticsService
  )
    return; // Already initialized

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

    // Initialize Intent Classification Service
    intentClassifier = new IntentClassificationService();
    console.log("🎯 Intent Classification Service initialized successfully");

    // Initialize Proactive Suggestions Service
    proactiveSuggestions = new ProactiveSuggestionsService();
    console.log("💡 Proactive Suggestions Service initialized successfully");

    // Initialize Analytics Service
    analyticsService = new AnalyticsService();
    console.log("📊 Analytics Service initialized successfully");
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

    // Smart query classification for routing
    const queryClassification = classifyQueryType(message);
    console.log(`🎯 Query classified as: ${queryClassification.queryType}`);
    console.log(
      `🔧 Should use web search: ${queryClassification.shouldUseWebSearch}`
    );
    console.log(
      `🔧 Should use MCP tools: ${queryClassification.shouldUseMCPTools}`
    );
    console.log(`🔧 Should use RAG: ${queryClassification.shouldUseRAG}`);

    // Smart routing: Handle general knowledge queries directly with MCP tools
    if (queryClassification.shouldUseWebSearch) {
      console.log(
        `🌐 Routing general knowledge query to web search: "${message}"`
      );

      // Process directly with MCP tools (web search)
      let finalAnswer = "I'll search for information about that for you.";
      let toolResults = {};
      let toolsUsed = [];

      if (mcpOrchestrator) {
        try {
          const mcpResult = await mcpOrchestrator.processWithTools(
            message,
            0.1, // Low confidence triggers web search
            ""
          );
          finalAnswer = mcpResult.enhancedAnswer;
          toolResults = mcpResult.toolResults;
          toolsUsed = mcpResult.toolsUsed;
        } catch (error) {
          console.error("MCP processing error:", error);
          finalAnswer =
            "I encountered an error while searching for that information. Please try again or contact support.";
        }
      }

      // Create assistant message for web search result
      const assistantMessage = new Message({
        conversationId: conversation._id,
        role: "assistant",
        content: finalAnswer,
        metadata: {
          searchResults: [],
          modelUsed: "mcp-web-search",
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
          queryClassification: queryClassification,
          mcpTools: {
            toolsUsed: toolsUsed,
            toolResults: toolResults,
          },
        },
      });
      await assistantMessage.save();
      await conversation.addMessage(assistantMessage._id);

      return {
        answer: finalAnswer,
        confidence: {
          score: 85,
          level: "High",
          factors: ["Web search results"],
        },
        sources: [],
        queryClassification: queryClassification,
        mcpTools: {
          toolsUsed: toolsUsed,
          toolResults: toolResults,
        },
        isWebSearch: true,
      };
    }

    // Smart routing: Handle MCP tool queries (mathematical, date/time, code validation, currency conversion)
    if (queryClassification.shouldUseMCPTools) {
      console.log(
        `🔧 Routing ${queryClassification.queryType} query to MCP tools: "${message}"`
      );

      // Process directly with MCP tools
      let finalAnswer = "I'll process that for you.";
      let toolResults = {};
      let toolsUsed = [];

      if (mcpOrchestrator) {
        try {
          const mcpResult = await mcpOrchestrator.processWithTools(
            message,
            0.9, // High confidence for MCP tool queries
            ""
          );
          finalAnswer = mcpResult.enhancedAnswer;
          toolResults = mcpResult.toolResults;
          toolsUsed = mcpResult.toolsUsed;
        } catch (error) {
          console.error("MCP processing error:", error);
          finalAnswer =
            "I encountered an error while processing that request. Please try again or contact support.";
        }
      }

      // Create assistant message for MCP tool result
      const assistantMessage = new Message({
        conversationId: conversation._id,
        role: "assistant",
        content: finalAnswer,
        metadata: {
          searchResults: [],
          modelUsed: "mcp-tools",
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
          queryClassification: queryClassification,
          mcpTools: {
            toolsUsed: toolsUsed,
            toolResults: toolResults,
          },
        },
      });
      await assistantMessage.save();
      await conversation.addMessage(assistantMessage._id);

      return {
        answer: finalAnswer,
        confidence: {
          score: 90,
          level: "High",
          factors: ["MCP tool results"],
        },
        sources: [],
        queryClassification: queryClassification,
        mcpTools: {
          toolsUsed: toolsUsed,
          toolResults: toolResults,
        },
        isMCPTools: true,
      };
    }

    // Continue with RAG search for Shopify-related queries
    const queryEmbedding = await embedSingle(enhancedContext.contextualQuery);

    // Classify intent for smart routing
    const intentClassification = await intentClassifier.classifyIntent(message);
    console.log(
      `🎯 Intent classified as: ${intentClassification.intent} (confidence: ${intentClassification.confidence})`
    );

    // Get routing configuration based on intent
    const routingConfig = intentClassifier.getRoutingConfig(
      intentClassification.intent
    );

    // Perform hybrid search with enhanced contextual query and intent-based routing
    const results = await retriever.search({
      query: enhancedContext.contextualQuery,
      queryEmbedding,
      k: 8, // Increased for more comprehensive results
      intent: intentClassification.intent,
      routingConfig: routingConfig,
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
          queryClassification: queryClassification,
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
        queryClassification: queryClassification,
        isEdgeCase: true,
      };
    }

    // Generate intent-specific prompt
    const intentSpecificPrompt = intentClassifier.generateIntentSpecificPrompt(
      intentClassification.intent,
      message,
      results
    );

    // Use multi-turn conversation manager for enhanced response generation with intent-specific prompt
    const enhancedResponse = await multiTurnManager.generateEnhancedResponse(
      message,
      sessionId,
      messages,
      results,
      intentSpecificPrompt
    );

    const answer = enhancedResponse.answer;

    // Calculate confidence score
    const confidence = calculateConfidence(
      results,
      answer,
      message,
      intentClassification
    );

    // Generate proactive suggestions
    const suggestionsResult =
      await proactiveSuggestions.getProactiveSuggestions(
        message,
        messages,
        intentClassification.intent,
        enhancedResponse.conversationState.userPreferences
      );
    console.log(
      `💡 Generated ${suggestionsResult.suggestions.length} proactive suggestions`
    );

    // Track question for analytics
    await analyticsService.trackQuestion(
      message,
      intentClassification.intent,
      enhancedResponse.conversationState.userPreferences,
      sessionId,
      confidence,
      results
    );
    console.log(`📊 Tracked question for analytics`);

    // Process with MCP tools if needed
    let finalAnswer = answer;
    let toolResults = {};
    let toolsUsed = [];

    if (mcpOrchestrator) {
      try {
        const mcpResult = await mcpOrchestrator.processWithTools(
          message,
          confidence.score / 100, // Convert to 0-1 scale
          answer
        );
        finalAnswer = mcpResult.enhancedAnswer;
        toolResults = mcpResult.toolResults;
        toolsUsed = mcpResult.toolsUsed;
      } catch (error) {
        console.error("MCP processing error:", error);
        // Continue with original answer if MCP fails
      }
    }

    // Create assistant message with multi-turn metadata
    const assistantMessage = new Message({
      conversationId: conversation._id,
      role: "assistant",
      content: finalAnswer,
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
        mcpTools: {
          toolsUsed: toolsUsed,
          toolResults: toolResults,
        },
        multiTurnContext: {
          turnCount: enhancedResponse.conversationState.turnCount,
          isFollowUp: enhancedResponse.followUpDetection.isFollowUp,
          userPreferences: enhancedResponse.conversationState.userPreferences,
          contextualQuery: enhancedResponse.contextualQuery,
        },
        intentClassification: {
          intent: intentClassification.intent,
          confidence: intentClassification.confidence,
          method: intentClassification.method,
          routingConfig: routingConfig,
        },
        proactiveSuggestions: suggestionsResult.suggestions,
      },
    });
    await assistantMessage.save();
    await conversation.addMessage(assistantMessage._id);

    return {
      answer: finalAnswer,
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
      intentClassification: {
        intent: intentClassification.intent,
        confidence: intentClassification.confidence,
        method: intentClassification.method,
        routingConfig: routingConfig,
      },
      queryClassification: queryClassification,
      mcpTools: {
        toolsUsed: toolsUsed,
        toolResults: toolResults,
      },
      proactiveSuggestions: suggestionsResult,
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

    // Smart query classification for clarified query
    const queryClassification = classifyQueryType(
      clarificationResult.clarifiedQuery
    );
    console.log(
      `🎯 Clarified query classified as: ${queryClassification.queryType}`
    );

    // Smart routing: Handle general knowledge queries directly with MCP tools
    if (queryClassification.shouldUseWebSearch) {
      console.log(
        `🌐 Routing clarified general knowledge query to web search: "${clarificationResult.clarifiedQuery}"`
      );

      // Process directly with MCP tools (web search)
      let finalAnswer = "I'll search for information about that for you.";
      let toolResults = {};
      let toolsUsed = [];

      if (mcpOrchestrator) {
        try {
          const mcpResult = await mcpOrchestrator.processWithTools(
            clarificationResult.clarifiedQuery,
            0.1, // Low confidence triggers web search
            ""
          );
          finalAnswer = mcpResult.enhancedAnswer;
          toolResults = mcpResult.toolResults;
          toolsUsed = mcpResult.toolsUsed;
        } catch (error) {
          console.error("MCP processing error:", error);
          finalAnswer =
            "I encountered an error while searching for that information. Please try again or contact support.";
        }
      }

      // Create assistant message for web search result
      const assistantMessage = new Message({
        conversationId: conversation._id,
        role: "assistant",
        content: finalAnswer,
        metadata: {
          searchResults: [],
          modelUsed: "mcp-web-search-clarification",
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
          clarificationProcessed: true,
          queryClassification: queryClassification,
          mcpTools: {
            toolsUsed: toolsUsed,
            toolResults: toolResults,
          },
        },
      });
      await assistantMessage.save();
      await conversation.addMessage(assistantMessage._id);

      return {
        answer: finalAnswer,
        confidence: {
          score: 85,
          level: "High",
          factors: ["Web search results"],
        },
        sources: [],
        queryClassification: queryClassification,
        mcpTools: {
          toolsUsed: toolsUsed,
          toolResults: toolResults,
        },
        isWebSearch: true,
        clarificationProcessed: true,
      };
    }

    // Continue with RAG search for Shopify-related queries
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
    const confidence = calculateConfidence(
      results,
      answer,
      clarificationResult.clarifiedQuery,
      null
    );

    // Process with MCP tools if needed
    let finalAnswer = answer;
    let toolResults = {};
    let toolsUsed = [];

    if (mcpOrchestrator) {
      try {
        const mcpResult = await mcpOrchestrator.processWithTools(
          clarificationResult.clarifiedQuery,
          confidence.score / 100,
          answer
        );
        finalAnswer = mcpResult.enhancedAnswer;
        toolResults = mcpResult.toolResults;
        toolsUsed = mcpResult.toolsUsed;
      } catch (error) {
        console.error("MCP processing error:", error);
      }
    }

    // Create assistant message
    const assistantMessage = new Message({
      conversationId: conversation._id,
      role: "assistant",
      content: finalAnswer,
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
        mcpTools: {
          toolsUsed: toolsUsed,
          toolResults: toolResults,
        },
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
      answer: finalAnswer,
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
      queryClassification: queryClassification,
      mcpTools: {
        toolsUsed: toolsUsed,
        toolResults: toolResults,
      },
    };
  } catch (error) {
    console.error("Error processing clarification response:", error);
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
