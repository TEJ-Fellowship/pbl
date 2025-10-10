// backend/src/apiDetector.js

/**
 * API Detection Module
 *
 * This module intelligently detects which Twilio API the user is working with
 * based on their queries, conversation history, and context.
 *
 * Key Features:
 * - Detects API from query content and keywords
 * - Learns from conversation history
 * - Provides confidence scores for detections
 * - Handles multi-API scenarios
 */

class APIDetector {
  constructor() {
    // API detection patterns with confidence scores
    this.apiPatterns = {
      sms: {
        keywords: [
          "sms",
          "message",
          "text",
          "notification",
          "twiml",
          "messaging",
          "send message",
          "receive message",
          "delivery status",
          "webhook",
          "a2p",
          "10dlc",
          "short code",
          "long code",
          "phone number",
        ],
        patterns: [
          /send.*sms/i,
          /receive.*message/i,
          /delivery.*status/i,
          /webhook.*message/i,
          /a2p.*10dlc/i,
          /phone.*number/i,
        ],
        confidence: 0.9,
      },
      voice: {
        keywords: [
          "voice",
          "call",
          "phone",
          "audio",
          "twiml",
          "gather",
          "say",
          "record",
          "conference",
          "conference call",
          "caller id",
          "dial",
          "hangup",
          "redirect",
          "enqueue",
          "dequeue",
          "queue",
        ],
        patterns: [
          /make.*call/i,
          /receive.*call/i,
          /voice.*twiml/i,
          /conference.*call/i,
          /caller.*id/i,
          /record.*call/i,
        ],
        confidence: 0.9,
      },
      video: {
        keywords: [
          "video",
          "room",
          "meeting",
          "stream",
          "participant",
          "track",
          "video room",
          "video call",
          "screen share",
          "recording",
          "compose",
          "subscribe",
          "publish",
          "unpublish",
        ],
        patterns: [
          /video.*room/i,
          /video.*call/i,
          /screen.*share/i,
          /video.*recording/i,
          /room.*participant/i,
        ],
        confidence: 0.9,
      },
      whatsapp: {
        keywords: [
          "whatsapp",
          "wa",
          "business api",
          "whatsapp business",
          "template",
          "media",
          "button",
          "list",
          "interactive",
        ],
        patterns: [
          /whatsapp.*api/i,
          /whatsapp.*business/i,
          /wa.*template/i,
          /whatsapp.*message/i,
        ],
        confidence: 0.95,
      },
      verify: {
        keywords: [
          "verify",
          "verification",
          "otp",
          "two factor",
          "2fa",
          "phone verification",
          "sms verification",
          "email verification",
          "verification code",
          "check",
          "approve",
        ],
        patterns: [
          /phone.*verification/i,
          /sms.*verification/i,
          /verification.*code/i,
          /two.*factor/i,
          /otp.*verification/i,
        ],
        confidence: 0.9,
      },
      lookup: {
        keywords: [
          "lookup",
          "phone lookup",
          "carrier lookup",
          "line type",
          "mobile",
          "landline",
          "voip",
          "carrier",
          "country code",
        ],
        patterns: [
          /phone.*lookup/i,
          /carrier.*lookup/i,
          /line.*type/i,
          /phone.*validation/i,
        ],
        confidence: 0.9,
      },
      conversations: {
        keywords: [
          "conversation",
          "chat",
          "messaging service",
          "conversation api",
          "participant",
          "message",
          "webhook",
          "conversation webhook",
        ],
        patterns: [
          /conversation.*api/i,
          /messaging.*service/i,
          /conversation.*webhook/i,
          /chat.*api/i,
        ],
        confidence: 0.9,
      },
      taskrouter: {
        keywords: [
          "taskrouter",
          "task",
          "worker",
          "workflow",
          "queue",
          "assignment",
          "reservation",
          "task queue",
          "worker capacity",
        ],
        patterns: [
          /task.*router/i,
          /task.*queue/i,
          /worker.*assignment/i,
          /workflow.*task/i,
        ],
        confidence: 0.9,
      },
      studio: {
        keywords: [
          "studio",
          "flow",
          "widget",
          "function",
          "split",
          "gather",
          "say",
          "play",
          "record",
          "connect",
        ],
        patterns: [
          /studio.*flow/i,
          /flow.*widget/i,
          /studio.*function/i,
          /visual.*flow/i,
        ],
        confidence: 0.9,
      },
      functions: {
        keywords: [
          "function",
          "serverless",
          "runtime",
          "twilio functions",
          "function service",
          "webhook",
          "http request",
        ],
        patterns: [
          /twilio.*function/i,
          /serverless.*function/i,
          /function.*service/i,
          /runtime.*function/i,
        ],
        confidence: 0.9,
      },
    };

    // API relationships for context
    this.apiRelationships = {
      sms: ["messaging", "webhooks", "phone_numbers"],
      voice: ["twiml", "webhooks", "phone_numbers"],
      video: ["rooms", "participants", "tracks"],
      whatsapp: ["messaging", "templates", "media"],
      verify: ["sms", "voice", "email"],
      lookup: ["phone_numbers"],
      conversations: ["messaging", "webhooks"],
      taskrouter: ["workers", "workflows", "queues"],
      studio: ["flows", "functions", "webhooks"],
      functions: ["webhooks", "http"],
    };
  }

  /**
   * Detect API from a single query
   * @param {string} query - User query
   * @param {Object} context - Conversation context
   * @returns {Object} Detection result with API and confidence
   */
  detectAPI(query, context = {}) {
    const queryLower = query.toLowerCase();
    const detections = [];

    // Check each API pattern
    Object.entries(this.apiPatterns).forEach(([api, config]) => {
      let score = 0;
      let matchedKeywords = [];
      let matchedPatterns = [];

      // Check keywords
      config.keywords.forEach((keyword) => {
        if (queryLower.includes(keyword)) {
          score += 1;
          matchedKeywords.push(keyword);
        }
      });

      // Check regex patterns
      config.patterns.forEach((pattern) => {
        if (pattern.test(query)) {
          score += 2; // Patterns are worth more
          matchedPatterns.push(pattern.source);
        }
      });

      if (score > 0) {
        // Calculate confidence based on score and base confidence
        const confidence = Math.min(0.95, (score / 5) * config.confidence);

        detections.push({
          api,
          confidence,
          score,
          matchedKeywords,
          matchedPatterns,
          reasons: this.generateDetectionReasons(
            api,
            matchedKeywords,
            matchedPatterns
          ),
        });
      }
    });

    // Sort by confidence
    detections.sort((a, b) => b.confidence - a.confidence);

    // Apply context-based adjustments
    const adjustedDetections = this.applyContextAdjustments(
      detections,
      context
    );

    return {
      primary: adjustedDetections[0] || null,
      all: adjustedDetections,
      confidence: adjustedDetections[0]?.confidence || 0,
      reasoning: this.generateReasoning(adjustedDetections, context),
    };
  }

  /**
   * Apply context-based adjustments to detections
   * @param {Array} detections - Raw detections
   * @param {Object} context - Conversation context
   * @returns {Array} Adjusted detections
   */
  applyContextAdjustments(detections, context) {
    const adjusted = [...detections];

    // Boost confidence for APIs mentioned in recent history
    if (context.recentHistory && context.recentHistory.length > 0) {
      const recentAPIs = this.extractRecentAPIs(context.recentHistory);
      adjusted.forEach((detection) => {
        if (recentAPIs.includes(detection.api)) {
          detection.confidence = Math.min(0.95, detection.confidence + 0.1);
          detection.reasons.push("Recent conversation context");
        }
      });
    }

    // Boost confidence for user's preferred API
    if (context.userPreferences?.api) {
      adjusted.forEach((detection) => {
        if (detection.api === context.userPreferences.api) {
          detection.confidence = Math.min(0.95, detection.confidence + 0.15);
          detection.reasons.push("User preference");
        }
      });
    }

    // Boost confidence for related APIs
    if (context.currentContext?.relatedAPIs) {
      adjusted.forEach((detection) => {
        if (context.currentContext.relatedAPIs.includes(detection.api)) {
          detection.confidence = Math.min(0.95, detection.confidence + 0.05);
          detection.reasons.push("Related API context");
        }
      });
    }

    return adjusted.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract APIs from recent conversation history
   * @param {Array} history - Conversation history
   * @returns {Array} Array of detected APIs
   */
  extractRecentAPIs(history) {
    const apis = new Set();
    history.forEach((turn) => {
      if (turn.metadata?.detectedAPI) {
        apis.add(turn.metadata.detectedAPI);
      }
    });
    return Array.from(apis);
  }

  /**
   * Generate detection reasons
   * @param {string} api - API name
   * @param {Array} keywords - Matched keywords
   * @param {Array} patterns - Matched patterns
   * @returns {Array} Array of reasons
   */
  generateDetectionReasons(api, keywords, patterns) {
    const reasons = [];

    if (keywords.length > 0) {
      reasons.push(`Keywords: ${keywords.slice(0, 3).join(", ")}`);
    }

    if (patterns.length > 0) {
      reasons.push(`Patterns: ${patterns.length} matched`);
    }

    return reasons;
  }

  /**
   * Generate overall reasoning for detection
   * @param {Array} detections - All detections
   * @param {Object} context - Conversation context
   * @returns {string} Reasoning text
   */
  generateReasoning(detections, context) {
    if (detections.length === 0) {
      return "No specific API detected from query";
    }

    const primary = detections[0];
    let reasoning = `Detected ${primary.api.toUpperCase()} API (confidence: ${(
      primary.confidence * 100
    ).toFixed(1)}%)`;

    if (primary.reasons.length > 0) {
      reasoning += ` based on: ${primary.reasons.join(", ")}`;
    }

    if (detections.length > 1) {
      const secondary = detections[1];
      reasoning += `. Also detected ${secondary.api.toUpperCase()} (${(
        secondary.confidence * 100
      ).toFixed(1)}%)`;
    }

    return reasoning;
  }

  /**
   * Get related APIs for a given API
   * @param {string} api - Primary API
   * @returns {Array} Array of related APIs
   */
  getRelatedAPIs(api) {
    return this.apiRelationships[api] || [];
  }

  /**
   * Check if two APIs are related
   * @param {string} api1 - First API
   * @param {string} api2 - Second API
   * @returns {boolean} Whether APIs are related
   */
  areAPIsRelated(api1, api2) {
    const related1 = this.getRelatedAPIs(api1);
    const related2 = this.getRelatedAPIs(api2);

    return (
      related1.includes(api2) ||
      related2.includes(api1) ||
      related1.some((api) => related2.includes(api))
    );
  }

  /**
   * Get API-specific suggestions
   * @param {string} api - API name
   * @returns {Object} API-specific suggestions
   */
  getAPISuggestions(api) {
    const suggestions = {
      sms: [
        "How to send SMS messages",
        "SMS delivery status webhooks",
        "A2P 10DLC compliance",
        "Phone number management",
      ],
      voice: [
        "Making and receiving calls",
        "Twilio Markup Language (TwiML)",
        "Call recording and monitoring",
        "Conference calls",
      ],
      video: [
        "Video room creation",
        "Participant management",
        "Screen sharing",
        "Video recording",
      ],
      whatsapp: [
        "WhatsApp Business API setup",
        "Message templates",
        "Interactive messages",
        "Media handling",
      ],
      verify: [
        "Phone number verification",
        "SMS verification codes",
        "Two-factor authentication",
        "Verification status checking",
      ],
    };

    return suggestions[api] || [];
  }
}

export default APIDetector;
