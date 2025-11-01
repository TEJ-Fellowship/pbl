import { WebSearchService } from "./webSearch.js";

export class TransactionTimelineService {
  constructor() {
    // Hardcoded hold period data based on common PayPal patterns
    this.holdPeriods = {
      new_account: {
        low_risk: { min: 1, max: 3, typical: 2 },
        medium_risk: { min: 3, max: 7, typical: 5 },
        high_risk: { min: 7, max: 21, typical: 14 },
      },
      established_account: {
        low_risk: { min: 0, max: 1, typical: 0 },
        medium_risk: { min: 1, max: 3, typical: 2 },
        high_risk: { min: 3, max: 7, typical: 5 },
      },
    };

    // Simple rule modifiers (days) applied after base period
    this.modifiers = {
      hasTracking: {
        typical: -1,
        note: "Tracking provided may accelerate release",
      },
      isDigital: {
        typical: -1,
        note: "Digital goods may clear faster when low-risk",
      },
      isEcheck: {
        typical: +3,
        max: +5,
        note: "eCheck adds extra clearing time",
      },
      hasDispute: {
        typical: +7,
        max: +14,
        note: "Dispute under review extends hold",
      },
    };

    // Optional web search for time-sensitive queries
    this.webSearch = new WebSearchService();
  }

  // Check if query is about transaction timelines
  isTimelineQuery(query) {
    const timelineKeywords = [
      "timeline",
      "hold",
      "hold period",
      "when will",
      "how long",
      "funds available",
      "money available",
      "release funds",
      "transaction time",
      "processing time",
      "settlement time",
      "pending",
      "held",
      "hold time",
      "funds hold",
      "when available",
    ];

    const lowerQuery = query.toLowerCase();
    return timelineKeywords.some((keyword) => lowerQuery.includes(keyword));
  }

  // Parse transaction details from query
  parseTransactionQuery(query) {
    const lowerQuery = query.toLowerCase();

    // Extract amount (simple regex)
    const amountMatch = lowerQuery.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const amount = amountMatch
      ? parseFloat(amountMatch[1].replace(/,/g, ""))
      : 100;

    // Determine account age
    const isNewAccount =
      lowerQuery.includes("new account") ||
      lowerQuery.includes("just started") ||
      lowerQuery.includes("recently opened");

    // Determine risk level based on amount
    let riskLevel = "low_risk";
    if (amount > 1000) riskLevel = "high_risk";
    else if (amount > 100) riskLevel = "medium_risk";

    // Additional signals
    const hasTracking =
      lowerQuery.includes("tracking") ||
      lowerQuery.includes("tracking number") ||
      lowerQuery.includes("provided tracking");
    const isDigital =
      lowerQuery.includes("digital") ||
      lowerQuery.includes("virtual") ||
      lowerQuery.includes("non-physical");
    const isEcheck =
      lowerQuery.includes("echeck") || lowerQuery.includes("e-check");
    const hasDispute =
      lowerQuery.includes("dispute") ||
      lowerQuery.includes("chargeback") ||
      lowerQuery.includes("case opened");

    // Basic region hints (very light-touch)
    let region = "generic";
    if (/(us|usa|united states|america)\b/.test(lowerQuery)) region = "us";
    else if (
      /(eu|europe|european union|germany|france|italy|spain|netherlands|poland|ireland|belgium)\b/.test(
        lowerQuery
      )
    )
      region = "eu";
    else if (/(uk|united kingdom|britain|england)\b/.test(lowerQuery))
      region = "uk";

    return {
      amount,
      accountAge: isNewAccount ? "new_account" : "established_account",
      riskLevel,
      hasTracking,
      isDigital,
      isEcheck,
      hasDispute,
      region,
    };
  }

  // Calculate estimated timeline
  calculateTimeline(transactionInfo) {
    const {
      accountAge,
      riskLevel,
      amount,
      hasTracking,
      isDigital,
      isEcheck,
      hasDispute,
    } = transactionInfo;
    const basePeriod = this.holdPeriods[accountAge][riskLevel];
    let minDays = basePeriod.min;
    let maxDays = basePeriod.max;
    let typicalDays = basePeriod.typical;

    const appliedNotes = [];

    // Apply rule modifiers
    if (hasTracking) {
      typicalDays += this.modifiers.hasTracking.typical;
      appliedNotes.push(this.modifiers.hasTracking.note);
    }
    if (isDigital && riskLevel === "low_risk") {
      typicalDays += this.modifiers.isDigital.typical;
      appliedNotes.push(this.modifiers.isDigital.note);
    }
    if (isEcheck) {
      typicalDays += this.modifiers.isEcheck.typical;
      maxDays += this.modifiers.isEcheck.max;
      appliedNotes.push(this.modifiers.isEcheck.note);
    }
    if (hasDispute) {
      typicalDays += this.modifiers.hasDispute.typical;
      maxDays += this.modifiers.hasDispute.max;
      appliedNotes.push(this.modifiers.hasDispute.note);
    }

    // Clamp values
    typicalDays = Math.max(minDays, Math.min(typicalDays, maxDays));

    // Confidence: more explicit signals -> higher confidence
    const signals = [hasTracking, isDigital, isEcheck, hasDispute].filter(
      Boolean
    ).length;
    let confidence = "low";
    if (signals >= 3) confidence = "high";
    else if (signals >= 1) confidence = "medium";

    return {
      min: minDays,
      max: maxDays,
      typical: typicalDays,
      accountAge,
      riskLevel,
      amount,
      notes: appliedNotes,
      confidence,
    };
  }

  // Main handler method
  async handleTimelineQuery(query) {
    try {
      const transactionInfo = this.parseTransactionQuery(query);
      const timeline = this.calculateTimeline(transactionInfo);

      // Format the response message
      const {
        min,
        max,
        typical,
        amount,
        accountAge,
        riskLevel,
        notes,
        confidence,
      } = timeline;

      let message = `📅 **Transaction Timeline Estimate**\n\n`;
      message += `💰 **Amount:** $${amount.toLocaleString()}\n`;
      message += `🏦 **Account Type:** ${
        accountAge === "new_account" ? "New Account" : "Established Account"
      }\n`;
      message += `⚠️ **Risk Level:** ${riskLevel
        .replace("_", " ")
        .toUpperCase()}\n\n`;

      message += `⏱️ **Estimated Hold Period:**\n`;
      if (min === max) {
        message += `• **${min} day${min !== 1 ? "s" : ""}** (typical)\n`;
      } else {
        message += `• **${min}-${max} days** (typical: ${typical} days)\n`;
      }

      message += `\n📝 **Notes:**\n`;
      if (accountAge === "new_account") {
        message += `• New accounts typically have longer hold periods for security\n`;
      }
      if (riskLevel === "high_risk") {
        message += `• Higher amounts may require additional verification\n`;
      }
      for (const n of notes) {
        message += `• ${n}\n`;
      }
      message += `• Actual hold times may vary based on specific circumstances\n`;
      message += `• Contact PayPal support for account-specific information\n`;

      message += `\n🔎 **Confidence:** ${confidence.toUpperCase()}\n`;

      // For "now/recent" queries, append top current references if available
      try {
        if (this.webSearch.shouldUseWebSearch(query)) {
          const searchQuery =
            "PayPal funds availability hold period shipping tracking policy";
          const refs = await this.webSearch.searchPayPalWeb(searchQuery);
          if (Array.isArray(refs) && refs.length > 0) {
            message += `\n🌐 **Recent references:**\n`;
            for (const r of refs) {
              message += `• ${r.title} — ${r.link}\n`;
            }
          }
        }
      } catch (_) {
        // Ignore web search errors; core estimator remains functional
      }

      return {
        success: true,
        message: message,
        data: {
          timeline,
          transactionInfo,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Timeline estimation failed: ${error.message}`,
      };
    }
  }
}
