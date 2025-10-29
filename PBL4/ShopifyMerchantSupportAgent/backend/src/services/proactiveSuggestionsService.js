import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Proactive Suggestions Service for Shopify Merchant Support Agent
 * Provides contextual suggestions based on conversation history and merchant needs
 */
export class ProactiveSuggestionsService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    });

    // Suggestion templates organized by context
    this.suggestionTemplates = {
      setup: [
        {
          trigger: "store_setup",
          suggestion:
            "You might also want to set up abandoned cart recovery to maximize your sales potential.",
          category: "sales_optimization",
          priority: "high",
        },
        {
          trigger: "payment_setup",
          suggestion:
            "Consider setting up multiple payment methods to reduce cart abandonment.",
          category: "conversion",
          priority: "high",
        },
        {
          trigger: "shipping_setup",
          suggestion:
            "You might want to configure shipping zones and rates for different regions.",
          category: "logistics",
          priority: "medium",
        },
        {
          trigger: "theme_setup",
          suggestion:
            "Consider optimizing your theme for mobile devices and page speed.",
          category: "performance",
          priority: "medium",
        },
        {
          trigger: "inventory_setup",
          suggestion:
            "You might want to set up inventory tracking and low stock alerts.",
          category: "inventory",
          priority: "medium",
        },
        {
          trigger: "basic_plan_upgrade",
          suggestion:
            "Since you're on the Basic plan, consider upgrading to Shopify plan for advanced features like professional reports and gift cards.",
          category: "plan_upgrade",
          priority: "high",
        },
        {
          trigger: "physical_store_pos",
          suggestion:
            "For physical stores, consider setting up Shopify POS to manage in-person sales alongside your online store.",
          category: "pos_setup",
          priority: "high",
        },
        {
          trigger: "new_merchant_onboarding",
          suggestion:
            "As a new merchant, check out our getting started guide to set up your store efficiently.",
          category: "onboarding",
          priority: "high",
        },
      ],
      troubleshooting: [
        {
          trigger: "payment_issues",
          suggestion:
            "Consider implementing a payment retry mechanism to reduce failed transactions.",
          category: "payment_optimization",
          priority: "high",
        },
        {
          trigger: "checkout_issues",
          suggestion:
            "You might want to simplify your checkout process to reduce abandonment.",
          category: "conversion",
          priority: "high",
        },
        {
          trigger: "shipping_issues",
          suggestion:
            "Consider offering free shipping thresholds to increase average order value.",
          category: "sales_optimization",
          priority: "medium",
        },
        {
          trigger: "performance_issues",
          suggestion:
            "You might want to optimize your images and enable lazy loading for better performance.",
          category: "performance",
          priority: "medium",
        },
        {
          trigger: "inventory_issues",
          suggestion:
            "Consider setting up automated inventory management to prevent overselling.",
          category: "inventory",
          priority: "medium",
        },
      ],
      optimization: [
        {
          trigger: "conversion_optimization",
          suggestion:
            "You might want to implement A/B testing for your product pages to improve conversions.",
          category: "testing",
          priority: "high",
        },
        {
          trigger: "seo_optimization",
          suggestion:
            "Consider implementing structured data markup to improve your search visibility.",
          category: "seo",
          priority: "medium",
        },
        {
          trigger: "email_marketing",
          suggestion:
            "You might want to set up automated email sequences for customer retention.",
          category: "marketing",
          priority: "medium",
        },
        {
          trigger: "analytics_optimization",
          suggestion:
            "Consider setting up conversion tracking and customer lifetime value analysis.",
          category: "analytics",
          priority: "medium",
        },
        {
          trigger: "mobile_optimization",
          suggestion:
            "You might want to optimize your mobile checkout experience for better conversions.",
          category: "mobile",
          priority: "high",
        },
      ],
      billing: [
        {
          trigger: "pricing_strategy",
          suggestion:
            "Consider implementing dynamic pricing based on customer segments and behavior.",
          category: "pricing",
          priority: "medium",
        },
        {
          trigger: "subscription_billing",
          suggestion:
            "You might want to offer subscription options for recurring revenue.",
          category: "revenue_model",
          priority: "high",
        },
        {
          trigger: "payment_methods",
          suggestion:
            "Consider adding buy now, pay later options to increase conversion rates.",
          category: "payment_options",
          priority: "medium",
        },
        {
          trigger: "tax_management",
          suggestion:
            "You might want to set up automated tax calculation for different regions.",
          category: "compliance",
          priority: "medium",
        },
        {
          trigger: "cost_optimization",
          suggestion:
            "Consider analyzing your transaction fees and optimizing payment processing costs.",
          category: "cost_management",
          priority: "low",
        },
      ],
      general: [
        {
          trigger: "customer_support",
          suggestion:
            "You might want to implement a live chat system to improve customer support.",
          category: "customer_experience",
          priority: "medium",
        },
        {
          trigger: "security",
          suggestion:
            "Consider implementing two-factor authentication for enhanced security.",
          category: "security",
          priority: "high",
        },
        {
          trigger: "backup",
          suggestion:
            "You might want to set up automated backups for your store data.",
          category: "data_protection",
          priority: "high",
        },
        {
          trigger: "compliance",
          suggestion:
            "Consider implementing GDPR compliance features for international customers.",
          category: "compliance",
          priority: "medium",
        },
        {
          trigger: "scalability",
          suggestion:
            "You might want to plan for traffic spikes during peak seasons.",
          category: "scalability",
          priority: "medium",
        },
      ],
    };

    // Context patterns for suggestion triggers
    this.contextPatterns = {
      store_setup: [
        /setup.*store/i,
        /create.*store/i,
        /new.*store/i,
        /getting.*started/i,
        /initial.*setup/i,
        /store.*configuration/i,
      ],
      payment_setup: [
        /setup.*payment/i,
        /payment.*method/i,
        /payment.*gateway/i,
        /payment.*processing/i,
        /stripe.*setup/i,
        /paypal.*setup/i,
      ],
      shipping_setup: [
        /setup.*shipping/i,
        /shipping.*zone/i,
        /shipping.*rate/i,
        /delivery.*option/i,
        /shipping.*method/i,
      ],
      theme_setup: [
        /setup.*theme/i,
        /theme.*customization/i,
        /theme.*configuration/i,
        /design.*setup/i,
        /appearance.*setup/i,
      ],
      inventory_setup: [
        /setup.*inventory/i,
        /inventory.*management/i,
        /product.*catalog/i,
        /stock.*management/i,
        /inventory.*tracking/i,
      ],
      payment_issues: [
        /payment.*problem/i,
        /payment.*error/i,
        /payment.*failed/i,
        /payment.*issue/i,
        /transaction.*failed/i,
      ],
      checkout_issues: [
        /checkout.*problem/i,
        /checkout.*error/i,
        /checkout.*issue/i,
        /cart.*abandonment/i,
        /checkout.*abandonment/i,
      ],
      shipping_issues: [
        /shipping.*problem/i,
        /shipping.*error/i,
        /shipping.*issue/i,
        /delivery.*problem/i,
        /shipping.*delay/i,
      ],
      performance_issues: [
        /slow.*loading/i,
        /performance.*issue/i,
        /page.*speed/i,
        /site.*slow/i,
        /loading.*time/i,
      ],
      inventory_issues: [
        /inventory.*problem/i,
        /stock.*issue/i,
        /out.*of.*stock/i,
        /inventory.*error/i,
        /overselling/i,
      ],
      conversion_optimization: [
        /conversion.*rate/i,
        /improve.*conversion/i,
        /increase.*sales/i,
        /boost.*sales/i,
        /sales.*optimization/i,
      ],
      seo_optimization: [
        /seo/i,
        /search.*engine/i,
        /google.*ranking/i,
        /search.*visibility/i,
        /organic.*traffic/i,
      ],
      email_marketing: [
        /email.*marketing/i,
        /email.*campaign/i,
        /newsletter/i,
        /email.*sequence/i,
        /customer.*email/i,
      ],
      analytics_optimization: [
        /analytics/i,
        /tracking/i,
        /metrics/i,
        /data.*analysis/i,
        /reporting/i,
      ],
      mobile_optimization: [
        /mobile.*optimization/i,
        /mobile.*experience/i,
        /mobile.*checkout/i,
        /responsive.*design/i,
        /mobile.*friendly/i,
      ],
      pricing_strategy: [
        /pricing.*strategy/i,
        /price.*optimization/i,
        /dynamic.*pricing/i,
        /pricing.*model/i,
        /price.*adjustment/i,
      ],
      subscription_billing: [
        /subscription/i,
        /recurring.*billing/i,
        /monthly.*billing/i,
        /subscription.*model/i,
        /recurring.*revenue/i,
      ],
      payment_methods: [
        /payment.*option/i,
        /payment.*method/i,
        /buy.*now.*pay.*later/i,
        /installment/i,
        /payment.*plan/i,
      ],
      tax_management: [
        /tax.*calculation/i,
        /tax.*management/i,
        /vat/i,
        /sales.*tax/i,
        /tax.*compliance/i,
      ],
      cost_optimization: [
        /cost.*optimization/i,
        /fee.*optimization/i,
        /transaction.*fee/i,
        /payment.*cost/i,
        /reduce.*cost/i,
      ],
      customer_support: [
        /customer.*support/i,
        /support.*system/i,
        /help.*desk/i,
        /customer.*service/i,
        /live.*chat/i,
      ],
      security: [
        /security/i,
        /two.*factor/i,
        /authentication/i,
        /secure/i,
        /protection/i,
      ],
      backup: [
        /backup/i,
        /data.*backup/i,
        /backup.*system/i,
        /data.*protection/i,
        /recovery/i,
      ],
      compliance: [/compliance/i, /gdpr/i, /privacy/i, /legal/i, /regulation/i],
      scalability: [
        /scalability/i,
        /traffic.*spike/i,
        /peak.*season/i,
        /high.*traffic/i,
        /performance.*scaling/i,
      ],
    };
  }

  /**
   * Analyze conversation context to determine relevant suggestions
   * @param {string} message - Current message
   * @param {Array} conversationHistory - Previous messages
   * @param {string} intent - Classified intent
   * @param {Object} userPreferences - User preferences
   * @returns {Array} Relevant suggestions
   */
  async analyzeContextForSuggestions(
    message,
    conversationHistory,
    intent,
    userPreferences
  ) {
    const suggestions = [];
    const messageLower = message.toLowerCase();

    // Get suggestions based on intent
    const intentSuggestions =
      this.suggestionTemplates[intent] || this.suggestionTemplates.general;

    // Analyze context patterns
    for (const [trigger, patterns] of Object.entries(this.contextPatterns)) {
      const hasPattern = patterns.some((pattern) => pattern.test(messageLower));

      if (hasPattern) {
        // Find matching suggestion template
        const matchingSuggestion = intentSuggestions.find(
          (s) => s.trigger === trigger
        );
        if (matchingSuggestion) {
          suggestions.push({
            ...matchingSuggestion,
            context: trigger,
            relevanceScore: this.calculateRelevanceScore(
              message,
              trigger,
              intent,
              userPreferences
            ),
          });
        }
      }
    }

    // Analyze conversation history for additional context
    const historyContext = this.analyzeConversationHistory(conversationHistory);
    suggestions.push(...historyContext);

    // Sort by relevance and priority
    suggestions.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aScore = a.relevanceScore + priorityWeight[a.priority];
      const bScore = b.relevanceScore + priorityWeight[b.priority];
      return bScore - aScore;
    });

    // Remove duplicates and limit to top 3
    const uniqueSuggestions = this.removeDuplicateSuggestions(suggestions);
    return uniqueSuggestions.slice(0, 3);
  }

  /**
   * Calculate relevance score for a suggestion
   * @param {string} message - Current message
   * @param {string} trigger - Trigger context
   * @param {string} intent - Classified intent
   * @param {Object} preferences - User preferences including merchant info
   * @returns {number} Relevance score (0-1)
   */
  calculateRelevanceScore(message, trigger, intent, preferences = {}) {
    let score = 0.5; // Base score

    // Boost score if trigger matches intent
    const intentSuggestions =
      this.suggestionTemplates[intent] || this.suggestionTemplates.general;
    const matchingSuggestion = intentSuggestions.find(
      (s) => s.trigger === trigger
    );
    if (matchingSuggestion) {
      score += 0.3;
    }

    // Boost score based on keyword frequency
    const keywords = trigger.split("_");
    const keywordMatches = keywords.filter((keyword) =>
      message.toLowerCase().includes(keyword)
    );
    score += (keywordMatches.length / keywords.length) * 0.2;

    // Boost score based on merchant information
    if (preferences.merchantPlanTier) {
      if (
        trigger.includes("basic_plan") &&
        preferences.merchantPlanTier === "basic"
      ) {
        score += 0.2;
      }
      if (
        trigger.includes("advanced") &&
        (preferences.merchantPlanTier === "plus" ||
          preferences.merchantPlanTier === "enterprise")
      ) {
        score += 0.2;
      }
    }

    if (preferences.storeType) {
      if (
        trigger.includes("physical") &&
        preferences.storeType === "physical"
      ) {
        score += 0.2;
      }
      if (trigger.includes("online") && preferences.storeType === "online") {
        score += 0.2;
      }
    }

    if (preferences.experienceLevel) {
      if (trigger.includes("new") && preferences.experienceLevel === "new") {
        score += 0.2;
      }
      if (
        trigger.includes("advanced") &&
        preferences.experienceLevel === "expert"
      ) {
        score += 0.2;
      }
    }

    if (preferences.industry && trigger.includes(preferences.industry)) {
      score += 0.2;
    }

    if (preferences.location && trigger.includes("location")) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Analyze conversation history for additional context
   * @param {Array} conversationHistory - Previous messages
   * @returns {Array} Additional suggestions
   */
  analyzeConversationHistory(conversationHistory) {
    const suggestions = [];
    const recentMessages = conversationHistory.slice(-5); // Last 5 messages
    const allText = recentMessages
      .map((msg) => msg.content)
      .join(" ")
      .toLowerCase();

    // Check for recurring themes
    const themes = {
      abandoned_cart: /cart.*abandon/i,
      conversion_rate: /conversion.*rate/i,
      mobile_experience: /mobile/i,
      email_marketing: /email/i,
      customer_support: /support/i,
      analytics: /analytics/i,
      seo: /seo|search/i,
      performance: /slow|performance/i,
    };

    for (const [theme, pattern] of Object.entries(themes)) {
      if (pattern.test(allText)) {
        const suggestion = this.getSuggestionForTheme(theme);
        if (suggestion) {
          suggestions.push({
            ...suggestion,
            context: "conversation_history",
            relevanceScore: 0.7,
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Get suggestion for a specific theme
   * @param {string} theme - Theme identifier
   * @returns {Object|null} Suggestion object
   */
  getSuggestionForTheme(theme) {
    const themeSuggestions = {
      abandoned_cart: {
        suggestion:
          "You might want to implement abandoned cart recovery emails to recover lost sales.",
        category: "conversion",
        priority: "high",
        trigger: "abandoned_cart_recovery",
      },
      conversion_rate: {
        suggestion:
          "Consider implementing A/B testing to optimize your conversion rates.",
        category: "testing",
        priority: "high",
        trigger: "conversion_testing",
      },
      mobile_experience: {
        suggestion:
          "You might want to optimize your mobile checkout experience for better conversions.",
        category: "mobile",
        priority: "high",
        trigger: "mobile_optimization",
      },
      email_marketing: {
        suggestion:
          "Consider setting up automated email sequences for customer retention and upselling.",
        category: "marketing",
        priority: "medium",
        trigger: "email_automation",
      },
      customer_support: {
        suggestion:
          "You might want to implement a live chat system to improve customer support.",
        category: "customer_experience",
        priority: "medium",
        trigger: "live_chat",
      },
      analytics: {
        suggestion:
          "Consider setting up advanced analytics tracking for better business insights.",
        category: "analytics",
        priority: "medium",
        trigger: "advanced_analytics",
      },
      seo: {
        suggestion:
          "You might want to implement structured data markup to improve your search visibility.",
        category: "seo",
        priority: "medium",
        trigger: "structured_data",
      },
      performance: {
        suggestion:
          "Consider optimizing your images and enabling lazy loading for better performance.",
        category: "performance",
        priority: "medium",
        trigger: "performance_optimization",
      },
    };

    return themeSuggestions[theme] || null;
  }

  /**
   * Remove duplicate suggestions
   * @param {Array} suggestions - Array of suggestions
   * @returns {Array} Unique suggestions
   */
  removeDuplicateSuggestions(suggestions) {
    const seen = new Set();
    return suggestions.filter((suggestion) => {
      const key = suggestion.suggestion.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Generate AI-powered suggestions based on context
   * @param {string} message - Current message
   * @param {Array} conversationHistory - Previous messages
   * @param {string} intent - Classified intent
   * @param {Object} userPreferences - User preferences
   * @returns {Array} AI-generated suggestions
   */
  async generateAISuggestions(
    message,
    conversationHistory,
    intent,
    userPreferences
  ) {
    try {
      console.log(
        "🤖 Generating AI suggestions for:",
        message.substring(0, 100) + "..."
      );

      const prompt = `Based on this Shopify merchant conversation, suggest 2-3 proactive recommendations:

Current Message: "${message}"
Intent: ${intent}
User Preferences: ${JSON.stringify(userPreferences)}
Recent Conversation: ${conversationHistory
        .slice(-3)
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n")}

Provide suggestions that are:
1. Actionable and specific to Shopify
2. Relevant to the current context
3. Focused on business growth and optimization
4. Appropriate for the merchant's technical level

Return as JSON array:
[
  {
    "suggestion": "specific actionable recommendation",
    "category": "category name",
    "priority": "high|medium|low",
    "reasoning": "why this suggestion is relevant"
  }
]`;

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const response = result.response?.text();
      console.log("🤖 AI response:", response?.substring(0, 200) + "...");

      if (!response) {
        console.log("🤖 No AI response received");
        return [];
      }

      // Clean response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      console.log(
        "🤖 Cleaned response:",
        cleanedResponse.substring(0, 200) + "..."
      );

      // Parse JSON response
      const aiSuggestions = JSON.parse(cleanedResponse);
      console.log("🤖 Parsed AI suggestions:", aiSuggestions.length);

      return aiSuggestions.map((suggestion) => ({
        ...suggestion,
        source: "ai_generated",
        relevanceScore: 0.8,
      }));
    } catch (error) {
      console.error("AI suggestion generation error:", error);
      return [];
    }
  }

  /**
   * Get fallback suggestions when no context-specific suggestions are found
   * @param {string} intent - Classified intent
   * @param {Object} userPreferences - User preferences
   * @returns {Array} Fallback suggestions
   */
  getFallbackSuggestions(intent, userPreferences) {
    const fallbackSuggestions = [
      {
        suggestion:
          "Consider setting up Google Analytics to track your store's performance and customer behavior.",
        category: "analytics",
        priority: "medium",
        reasoning:
          "Analytics help you understand your customers better and optimize your store.",
        source: "fallback",
        relevanceScore: 0.6,
      },
      {
        suggestion:
          "Enable customer reviews and testimonials to build trust and increase conversions.",
        category: "conversion",
        priority: "high",
        reasoning:
          "Social proof is crucial for e-commerce success and can significantly boost sales.",
        source: "fallback",
        relevanceScore: 0.7,
      },
      {
        suggestion:
          "Set up email marketing campaigns to nurture leads and retain customers.",
        category: "marketing",
        priority: "medium",
        reasoning:
          "Email marketing has one of the highest ROI of all marketing channels.",
        source: "fallback",
        relevanceScore: 0.6,
      },
    ];

    // Customize based on merchant plan
    if (userPreferences.merchantPlanTier === "basic") {
      fallbackSuggestions.push({
        suggestion:
          "Consider upgrading to Shopify Plus for advanced features and better support.",
        category: "growth",
        priority: "low",
        reasoning:
          "Advanced features can help scale your business as you grow.",
        source: "fallback",
        relevanceScore: 0.5,
      });
    }

    return fallbackSuggestions.slice(0, 2); // Return top 2 fallback suggestions
  }

  /**
   * Get proactive suggestions for a conversation
   * @param {string} message - Current message
   * @param {Array} conversationHistory - Previous messages
   * @param {string} intent - Classified intent
   * @param {Object} userPreferences - User preferences
   * @returns {Object} Suggestions result
   */
  async getProactiveSuggestions(
    message,
    conversationHistory,
    intent,
    userPreferences
  ) {
    try {
      console.log("💡 Getting proactive suggestions for intent:", intent);

      // Get rule-based suggestions
      const ruleBasedSuggestions = await this.analyzeContextForSuggestions(
        message,
        conversationHistory,
        intent,
        userPreferences
      );
      console.log("💡 Rule-based suggestions:", ruleBasedSuggestions.length);

      // Get AI-generated suggestions
      const aiSuggestions = await this.generateAISuggestions(
        message,
        conversationHistory,
        intent,
        userPreferences
      );
      console.log("💡 AI-generated suggestions:", aiSuggestions.length);

      // Combine and deduplicate suggestions
      const allSuggestions = [...ruleBasedSuggestions, ...aiSuggestions];
      const uniqueSuggestions = this.removeDuplicateSuggestions(allSuggestions);
      console.log("💡 Total unique suggestions:", uniqueSuggestions.length);

      // If no suggestions found, provide fallback suggestions
      if (uniqueSuggestions.length === 0) {
        console.log("💡 No suggestions found, providing fallback suggestions");
        const fallbackSuggestions = this.getFallbackSuggestions(
          intent,
          userPreferences
        );
        uniqueSuggestions.push(...fallbackSuggestions);
      }

      // Sort by relevance and priority
      uniqueSuggestions.sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const aScore = a.relevanceScore + priorityWeight[a.priority];
        const bScore = b.relevanceScore + priorityWeight[b.priority];
        return bScore - aScore;
      });

      const finalSuggestions = uniqueSuggestions.slice(0, 3);
      console.log("💡 Final suggestions to return:", finalSuggestions.length);

      return {
        suggestions: finalSuggestions,
        totalFound: uniqueSuggestions.length,
        intent: intent,
        context: {
          messageLength: message.length,
          conversationLength: conversationHistory.length,
          userPreferences: userPreferences,
        },
      };
    } catch (error) {
      console.error("Error generating proactive suggestions:", error);
      return {
        suggestions: [],
        totalFound: 0,
        intent: intent,
        error: error.message,
      };
    }
  }

  /**
   * Get tool information
   * @returns {Object} Tool metadata
   */
  getToolInfo() {
    return {
      name: "proactive_suggestions",
      description:
        "Generate contextual suggestions to help merchants optimize their Shopify stores",
      capabilities: [
        "Context-aware suggestion generation",
        "Rule-based pattern matching",
        "AI-powered recommendation engine",
        "Priority-based suggestion ranking",
        "Conversation history analysis",
      ],
      categories: [
        "sales_optimization",
        "conversion",
        "logistics",
        "performance",
        "inventory",
        "payment_optimization",
        "testing",
        "seo",
        "marketing",
        "analytics",
        "mobile",
        "pricing",
        "revenue_model",
        "payment_options",
        "compliance",
        "cost_management",
        "customer_experience",
        "security",
        "data_protection",
        "scalability",
      ],
      examples: [
        "Suggest abandoned cart recovery when discussing checkout issues",
        "Recommend A/B testing when optimizing conversion rates",
        "Propose mobile optimization when discussing mobile experience",
        "Suggest email automation when discussing customer retention",
      ],
    };
  }
}

export default ProactiveSuggestionsService;
