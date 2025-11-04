import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../../config/config.js";

/**
 * Detect if a query is a greeting or general help request
 * @param {string} query - User query
 * @returns {Object} Detection results
 */
export function detectGreetingOrGeneralQuery(query) {
  if (!query) return { isGreeting: false, isGeneralHelpRequest: false };

  const q = query.toLowerCase().trim();

  // Common greeting patterns
  const greetingPatterns = [
    /^(hi|hello|hey|greetings|howdy|good morning|good afternoon|good evening)(\s|$)/i,
    /^(how are you|how's it going|what's up|sup)(\s|$)/i,
  ];

  // General help request patterns
  const generalHelpPatterns = [
    /^(help|can you help|i need help|assist me|support)(\s|$)/i,
    /^(what can you do|how does this work|tell me about yourself)(\s|$)/i,
  ];

  // Check if query contains Mailchimp-related keywords
  const mailchimpKeywords = [
    "mailchimp",
    "mail chimp",
    "email",
    "campaign",
    "newsletter",
    "subscriber",
    "audience",
    "list",
    "template",
    "automation",
    "segment",
    "tag",
    "merge field",
  ];

  const isGreeting = greetingPatterns.some((pattern) => pattern.test(q));
  const isGeneralHelpRequest = generalHelpPatterns.some((pattern) =>
    pattern.test(q)
  );
  const mailchimpRelated = mailchimpKeywords.some((keyword) =>
    q.includes(keyword.toLowerCase())
  );

  // Try to extract name from greeting or introduction
  let extractedName = null;

  // Pattern 1: "this is [name]", "i am [name]", "my name is [name]"
  const introPatterns = [
    /\bthis\s+is\s+([a-z]+)\b/i,
    /\bi\s+am\s+([a-z]+)\b/i,
    /\bi'?m\s+([a-z]+)\b/i,
    /\bmy\s+name\s+is\s+([a-z]+)\b/i,
    /\bcall\s+me\s+([a-z]+)\b/i,
  ];

  for (const pattern of introPatterns) {
    const introMatch = q.match(pattern);
    if (introMatch && introMatch[1]) {
      const potentialName = introMatch[1].toLowerCase();
      const commonWords = [
        "here",
        "not",
        "ready",
        "interested",
        "sure",
        "good",
        "fine",
        "done",
        "back",
        "going",
        "okay",
        "ok",
      ];

      if (!commonWords.includes(potentialName)) {
        extractedName =
          potentialName.charAt(0).toUpperCase() + potentialName.slice(1);
        break;
      }
    }
  }

  // Pattern 2: "Hi [name], ..." or "Hey [name]" (only if no name found yet)
  if (!extractedName && isGreeting) {
    const nameMatch = q.match(/^(?:hi|hello|hey|greetings)\s+([a-z]+)[\s,]/i);
    if (nameMatch && nameMatch[1]) {
      const potentialName = nameMatch[1].toLowerCase();
      // Filter out common false positives
      const commonWords = [
        "how",
        "there",
        "everyone",
        "all",
        "folks",
        "guys",
        "what",
        "who",
        "where",
        "when",
        "why",
        "can",
        "could",
        "would",
        "should",
        "are",
        "is",
        "am",
        "my",
        "your",
        "i",
        "you",
        "we",
        "they",
        "this",
      ];

      // Only set as name if it's not a common word
      if (!commonWords.includes(potentialName)) {
        extractedName =
          potentialName.charAt(0).toUpperCase() + potentialName.slice(1);
      }
    }
  }

  return {
    isGreeting,
    isGeneralHelpRequest,
    mailchimpRelated,
    extractedName,
  };
}

/**
 * AI-powered query classifier for categorizing user queries
 */
class QueryClassifier {
  constructor(model = null) {
    this.model = model;

    // Initialize Gemini AI if not provided and API key is available
    if (!model && config.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      } catch (error) {
        console.log(
          "⚠️ Failed to initialize Gemini for query classification:",
          error.message
        );
      }
    }
  }

  /**
   * Classify a query using rule-based and AI methods
   * @param {string} query - User query
   * @param {number} confidenceThreshold - Confidence threshold for classification
   * @param {Object} context - Additional context for classification
   * @returns {Object} Classification result
   */
  async classifyQuery(query, confidenceThreshold = 0.5, context = null) {
    // First, try rule-based classification (fast and reliable for common patterns)
    const ruleBasedResult = this.classifyWithRules(query);

    // If rule-based classification is confident enough, return it
    if (ruleBasedResult.confidence >= confidenceThreshold) {
      return ruleBasedResult;
    }

    // Otherwise, try AI-based classification if model is available
    if (this.model) {
      try {
        const aiResult = await this.classifyWithAI(query, context);
        // Combine results, preferring AI if it's confident
        if (aiResult.confidence > ruleBasedResult.confidence) {
          return aiResult;
        }
      } catch (error) {
        console.log("⚠️ AI classification failed:", error.message);
      }
    }

    // Fallback to rule-based result
    return ruleBasedResult;
  }

  /**
   * Rule-based classification of queries
   * @param {string} query - User query
   * @returns {Object} Classification result
   */
  classifyWithRules(query) {
    if (!query) {
      return { category: "unknown", confidence: 0, approach: "HYBRID_SEARCH" };
    }

    const q = query.toLowerCase().trim();

    // Check for personal information queries (conversation memory)
    if (
      q.includes("my name") ||
      q.includes("what is my") ||
      q.includes("who am i") ||
      q.includes("do you know me") ||
      q.includes("remember me") ||
      q.includes("what did i say") ||
      q.includes("what did we talk") ||
      q.includes("our conversation") ||
      q.includes("earlier i") ||
      q.includes("i told you")
    ) {
      return {
        category: "personal_info",
        confidence: 0.95,
        approach: "CONVERSATION_MEMORY",
        reasoning: "Query seeks personal information from conversation memory",
      };
    }

    // Check for MCP tool specific patterns
    if (
      q.includes("best practice") ||
      q.includes("trend") ||
      q.includes("latest") ||
      q.includes("subject line") ||
      q.includes("analyze subject") ||
      q.includes("send time") ||
      q.includes("best time") ||
      q.includes("best day") ||
      ((q.includes("list growth") ||
        q.includes("subscriber growth") ||
        q.includes("growth rate") ||
        q.includes("email growth") ||
        q.includes("calculate growth") ||
        (q.includes("growth") && q.includes("rate")) ||
        q.includes("list rate")) &&
        /\d/.test(q))
    ) {
      return {
        category: "mcp_tools",
        confidence: 0.85,
        approach: "MCP_TOOLS_ONLY",
        reasoning: "Query matches MCP tool patterns",
      };
    }

    // Check for documentation-related patterns
    if (
      q.includes("how to") ||
      q.includes("how do i") ||
      q.includes("guide") ||
      q.includes("tutorial") ||
      q.includes("documentation") ||
      q.includes("explain") ||
      q.includes("what is") ||
      q.includes("where can i find")
    ) {
      return {
        category: "documentation",
        confidence: 0.75,
        approach: "HYBRID_SEARCH",
        reasoning: "Query seeks how-to information or documentation",
      };
    }

    // Check for conversational patterns
    const greetingDetection = detectGreetingOrGeneralQuery(query);
    if (
      greetingDetection.isGreeting ||
      greetingDetection.isGeneralHelpRequest
    ) {
      return {
        category: "conversational",
        confidence: 0.9,
        approach: "CONVERSATIONAL",
        reasoning: "Query is a greeting or general help request",
      };
    }

    // Default to combined approach with lower confidence
    return {
      category: "unknown",
      confidence: 0.3,
      approach: "COMBINED",
      reasoning: "No clear pattern detected",
    };
  }

  /**
   * AI-powered classification of queries
   * @param {string} query - User query
   * @param {Object} context - Additional context for classification
   * @returns {Object} Classification result
   */
  async classifyWithAI(query, context = null) {
    if (!this.model || !query) {
      return { category: "unknown", confidence: 0, approach: "HYBRID_SEARCH" };
    }

    try {
      const prompt = `You are an expert query classifier for a Mailchimp support agent. 
Analyze the following user query and classify it into one of these categories:
1. "mcp_tools" - Queries related to email marketing best practices, trends, subject line analysis, send time optimization, or list growth calculations.
2. "documentation" - Queries seeking information from Mailchimp documentation, how-tos, guides, or explanations of Mailchimp features.
3. "conversational" - General greetings, chitchat, or non-specific help requests.

Also determine the best approach to handle this query:
- "MCP_TOOLS_ONLY" - Use specialized marketing tools only
- "HYBRID_SEARCH" - Search Mailchimp documentation only
- "COMBINED" - Try tools first, then fall back to documentation
- "CONVERSATIONAL" - Handle as conversation without specific tools

User Query: "${query}"

${context ? `Additional context: ${JSON.stringify(context)}` : ""}

Respond with a JSON object containing:
{
  "category": "mcp_tools|documentation|conversational",
  "confidence": <number between 0-1>,
  "approach": "MCP_TOOLS_ONLY|HYBRID_SEARCH|COMBINED|CONVERSATIONAL",
  "reasoning": "<brief explanation of classification>"
}`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const classification = JSON.parse(jsonMatch[0]);
        return {
          category: classification.category || "unknown",
          confidence: classification.confidence || 0.5,
          approach: classification.approach || "HYBRID_SEARCH",
          reasoning: classification.reasoning || "AI classification",
        };
      }

      // Fallback if JSON parsing fails
      return {
        category: "unknown",
        confidence: 0.4,
        approach: "COMBINED",
        reasoning: "AI classification failed to parse",
      };
    } catch (error) {
      console.error("AI classification error:", error);
      return {
        category: "unknown",
        confidence: 0.3,
        approach: "HYBRID_SEARCH",
        reasoning: "AI classification error",
      };
    }
  }
}

/**
 * Helper function to classify a query using the QueryClassifier
 * @param {string} query - User query
 * @param {Object} model - Gemini model instance (optional)
 * @returns {Object} Classification result
 */
export async function classifyQuery(query, model = null) {
  const classifier = new QueryClassifier(model);
  return classifier.classifyQuery(query);
}

export default QueryClassifier;
