/**
 * Intent Classifier
 * Classifies user queries to determine if MCP tools should be used
 */

export function classifyIntent(query) {
  if (!query || typeof query !== "string") {
    return {
      intent: "general_query",
      confidence: 0.5,
      tool: null,
    };
  }

  const lowerQuery = query.toLowerCase();

  // FIRST: Check if query contains an order ID (even without explicit tracking words)
  // This handles follow-up messages like "My order ID is FM100001"
  const orderIdPatterns = [
    /(?:order\s*(?:id|number|#)?\s*:?\s*is\s*)?(fm\d{5,})/i,
    /(?:order\s*(?:id|number|#)?\s*:?\s*is\s*)?(ord-?\d{4,})/i,
    /(?:my\s*order\s*(?:id|number|#)?\s*(?:is)?\s*:?\s*)?(fm\d{5,})/i,
    /(?:my\s*order\s*(?:id|number|#)?\s*(?:is)?\s*:?\s*)?(ord-?\d{4,})/i,
    /\b(fm\d{5,})\b/i, // Standalone FM with word boundaries
    /\b(ord-?\d{4,})\b/i, // Standalone ORD- with word boundaries
  ];

  let detectedOrderId = null;
  for (const pattern of orderIdPatterns) {
    const match = query.match(pattern);
    if (match && match[1] && match[1].trim().length >= 5) {
      detectedOrderId = match[1].toUpperCase().trim();
      break;
    }
  }

  // If order ID is found, prioritize tracking intent
  if (detectedOrderId) {
    // Check if there are specific tool keywords
    if (
      /driver|delivery.*person|rider|who.*delivering|contact.*driver/i.test(
        lowerQuery
      )
    ) {
      return {
        intent: "get_driver_info",
        confidence: 0.9,
        orderId: detectedOrderId,
        tool: "get_driver_info",
      };
    }
    if (/progress|stage|step|timeline|when.*ready/i.test(lowerQuery)) {
      return {
        intent: "get_progress",
        confidence: 0.9,
        orderId: detectedOrderId,
        tool: "get_progress_tracking",
      };
    }
    if (/route|map|navigation|directions/i.test(lowerQuery)) {
      return {
        intent: "get_route",
        confidence: 0.9,
        orderId: detectedOrderId,
        tool: "get_route_info",
      };
    }
    // Default: comprehensive tracking if order ID found
    return {
      intent: "track_order",
      confidence: 0.95,
      orderId: detectedOrderId,
      tool: "get_all_details",
    };
  }

  // Order tracking intents - more comprehensive patterns
  const trackingPatterns = [
    /track.*order|where.*order|order.*status|order.*location|delivery.*status|eta|estimated.*time|arrival/,
    /where.*is.*my.*order|check.*order|view.*order|show.*order|what.*is.*my.*order|whats.*my.*order/,
    /order.*id|order.*number|fm\d+|ord-?\d+/,
    /driver|delivery.*person|rider|location.*tracking/,
    /my.*order|the.*order/,
  ];

  // Order details intents
  const orderDetailsPatterns = [
    /order.*detail|order.*item|order.*total|what.*order|order.*info/,
  ];

  // Payment issue intents
  const paymentIssuePatterns = [
    /payment.*fail|payment.*problem|payment.*issue|payment.*not.*work|charged.*twice|double.*charge/,
    /esewa.*not.*work|khalti.*not.*work|payment.*error|transaction.*fail/,
    /money.*deduct|amount.*deduct|paid.*but|payment.*success.*but/,
  ];

  // Refund request intents
  const refundRequestPatterns = [
    /refund|money.*back|return.*money|get.*refund|cancel.*order|want.*refund/,
    /didnt.*receive|wrong.*order|never.*arrived|order.*cancel/,
  ];

  // Restaurant query intents
  const restaurantQueryPatterns = [
    /restaurant|menu|update.*menu|change.*menu|partner/,
    /pause.*order|stop.*order|restaurant.*close|business.*hour/,
    /add.*item|remove.*item|modify.*menu|restaurant.*login/,
  ];

  // Restaurant search intents (reviews, menu, info)
  const restaurantSearchPatterns = [
    /restaurant.*review|review.*restaurant|rating|how.*good.*restaurant/i,
    /menu.*restaurant|restaurant.*menu|what.*serve|dish|food.*serve|menu.*of/i,
    /hours.*restaurant|restaurant.*open|business.*hours|when.*open/i,
    /contact.*restaurant|restaurant.*phone|call.*restaurant|restaurant.*address|contact.*info/i,
    /info.*restaurant|restaurant.*info|about.*restaurant|restaurant.*detail|tell.*me.*about|about/i,
  ];

  // Delivery problem intents
  const deliveryProblemPatterns = [
    /delivery.*delay|late|taking.*long|still.*waiting|not.*arrived/,
    /driver.*late|where.*driver|slow.*delivery|delay/,
    /food.*cold|wrong.*address|cant.*find|delivery.*issue/,
  ];

  // General payment intents (not issues)
  const paymentPatterns = [
    /how.*pay|payment.*method|payment.*option|accept.*cash|cod|wallet/,
  ];

  // Driver intents
  const driverPatterns = [
    /driver|delivery.*person|rider|who.*delivering|contact.*driver/,
  ];

  // Progress intents
  const progressPatterns = [
    /progress|stage|step|timeline|when.*ready|preparing|cooking/,
  ];

  // Route intents
  const routePatterns = [/route|map|navigation|directions|way|path/];

  // Cultural/festival intents
  const festivalPatterns = [
    /festival|dashain|tihar|holi|indrajatra|buddha.*jayanti|janai.*purnima|losar|yomari/i,
    /what.*festival|festival.*today|festival.*food|celebrat/i,
  ];

  const regionalFoodPatterns = [
    /food.*in.*pokhara|pokhara.*food|thamel.*food|regional.*food|local.*food/i,
    /what.*food.*kathmandu|nepali.*cuisine|traditional.*food/i,
    /food.*preference|regional.*preference|local.*cuisine/i,
  ];

  // Weather intents
  const weatherPatterns = [
    /current.*weather|weather.*now|weather.*today|how.*weather/i,
    /temperature.*now|is.*raining|rain.*outside|weather.*condition/i,
    /weather.*report|weather.*info|weather.*update/i,
    /^what.*weather/i, // Matches "what is the weather" or "what weather today"
  ];

  const weatherFoodPatterns = [
    /food.*for.*(weather|cold|rain|hot)/i,
    /what.*eat.*(cold|rain|hot|weather)/i,
    /weather.*food|food.*weather/i,
    /suggest.*food.*weather|recommend.*food.*(weather|temperature|cold|hot)/i,
    /what.*food.*(weather|cold|rain|hot)/i,
    /(breakfast|lunch|dinner|snack).*for.*(weather|cold|rain|hot)/i,
    /what.*(breakfast|lunch|dinner|snack).*weather/i,
  ];

  // Check for cultural/festival queries (BEFORE other checks)
  if (festivalPatterns.some((pattern) => pattern.test(lowerQuery))) {
    const isCheckingFestival =
      /festival.*today|what.*festival|festival.*now/i.test(lowerQuery);
    const isFoodSuggestion =
      /festival.*food|food.*festival|what.*eat.*festival|food.*during.*festival|eat.*during.*(dashain|tihar|holi|indra)/i.test(
        lowerQuery
      );

    if (isFoodSuggestion) {
      // Extract festival name or region if mentioned
      let festival = null;
      let region = null;

      // Try to extract festival name
      const festivalNames = [
        "dashain",
        "tihar",
        "holi",
        "indra",
        "indrajatra",
        "buddha jayanti",
        "janai purnima",
        "losar",
        "yomari",
        "maghe sankranti",
        "shivaratri",
      ];
      for (const name of festivalNames) {
        if (lowerQuery.includes(name)) {
          festival = name;
          break;
        }
      }

      // Try to extract region
      const regions = [
        "kathmandu",
        "pokhara",
        "chitwan",
        "thamel",
        "patan",
        "boudha",
        "terai",
        "hills",
        "nepal",
      ];
      for (const reg of regions) {
        if (lowerQuery.includes(reg)) {
          region = reg;
          break;
        }
      }

      return {
        intent: "festival_food_suggestion",
        confidence: 0.85,
        orderId: null,
        tool: "suggest_festival_food",
        festival: festival,
        region: region,
      };
    }

    return {
      intent: "festival_check",
      confidence: 0.85,
      orderId: null,
      tool: "check_festival_schedule",
    };
  }

  if (regionalFoodPatterns.some((pattern) => pattern.test(lowerQuery))) {
    // Extract region if mentioned
    let region = null;
    const regions = [
      "kathmandu",
      "pokhara",
      "chitwan",
      "thamel",
      "patan",
      "boudha",
      "terai",
      "hills",
      "nepal",
    ];
    for (const reg of regions) {
      if (lowerQuery.includes(reg)) {
        region = reg;
        break;
      }
    }

    return {
      intent: "regional_preferences",
      confidence: 0.85,
      orderId: null,
      tool: "get_regional_preferences",
      region: region,
    };
  }

  // Check for weather-based food suggestions
  if (weatherFoodPatterns.some((pattern) => pattern.test(lowerQuery))) {
    // Extract meal type if mentioned
    let mealType = "any";
    const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
    for (const meal of mealTypes) {
      if (lowerQuery.includes(meal)) {
        mealType = meal;
        break;
      }
    }

    return {
      intent: "weather_based_food",
      confidence: 0.85,
      orderId: null,
      tool: "suggest_weather_based_food",
      mealType: mealType,
    };
  }

  // Check for current weather queries
  if (weatherPatterns.some((pattern) => pattern.test(lowerQuery))) {
    return {
      intent: "current_weather",
      confidence: 0.85,
      orderId: null,
      tool: "get_current_weather",
    };
  }

  // Check for restaurant search queries (reviews, menu, hours, info)
  if (restaurantSearchPatterns.some((pattern) => pattern.test(lowerQuery))) {
    // Extract restaurant name if mentioned
    let restaurantName = null;
    // Try different patterns in order of specificity
    const menuPattern = /menu\s+(?:of|for)\s+([a-z\s]+?)(?:\?|$)/i;
    const restaurantPattern =
      /(?:restaurant|from)\s+([a-z\s]+?)(?:\s+(?:menu|review|rating|hours|contact|info|phone|address|when|what))/i;
    const aboutPattern = /(?:about|tell\s+me\s+about)\s+([a-z\s]+)/i;
    const contactPattern = /contact.*info.*for\s+([a-z\s]+)/i;

    if (menuPattern.test(lowerQuery)) {
      const match = lowerQuery.match(menuPattern);
      restaurantName = match[1].trim();
    } else if (contactPattern.test(lowerQuery)) {
      const match = lowerQuery.match(contactPattern);
      restaurantName = match[1].trim();
    } else if (restaurantPattern.test(lowerQuery)) {
      const match = lowerQuery.match(restaurantPattern);
      restaurantName = match[1].trim();
    } else if (aboutPattern.test(lowerQuery)) {
      const match = lowerQuery.match(aboutPattern);
      restaurantName = match[1].trim();
    }

    // Determine query type
    let queryType = "general";
    if (/menu|dish|what.*serve|food.*serve/i.test(lowerQuery)) {
      queryType = "menu";
    } else if (/review|rating|how.*good/i.test(lowerQuery)) {
      queryType = "reviews";
    } else if (/hours|open|when.*open|business.*hours/i.test(lowerQuery)) {
      queryType = "hours";
    } else if (/contact|phone|address|call/i.test(lowerQuery)) {
      queryType = "contact";
    }

    return {
      intent: "restaurant_search",
      confidence: 0.85,
      orderId: null,
      tool: "web_search_restaurant",
      restaurantName: restaurantName,
      queryType: queryType,
    };
  }

  // Check for payment issues (BEFORE general payment queries)
  if (paymentIssuePatterns.some((pattern) => pattern.test(lowerQuery))) {
    const orderId = getOrderIdFromQuery(query);
    return {
      intent: "payment_issue",
      confidence: 0.9,
      orderId: orderId,
      tool: null, // Handle via RAG + potential escalation
      needsOrderId: !orderId,
    };
  }

  // Check for refund requests
  if (refundRequestPatterns.some((pattern) => pattern.test(lowerQuery))) {
    const orderId = getOrderIdFromQuery(query);
    return {
      intent: "refund_request",
      confidence: 0.9,
      orderId: orderId,
      tool: null, // Handle via RAG + potential escalation
      needsOrderId: !orderId,
    };
  }

  // Check for restaurant queries
  if (restaurantQueryPatterns.some((pattern) => pattern.test(lowerQuery))) {
    return {
      intent: "restaurant_query",
      confidence: 0.85,
      orderId: null,
      tool: null, // Handle via RAG
    };
  }

  // Check for delivery problems
  if (deliveryProblemPatterns.some((pattern) => pattern.test(lowerQuery))) {
    const orderId = getOrderIdFromQuery(query);
    return {
      intent: "delivery_problem",
      confidence: 0.9,
      orderId: orderId,
      tool: orderId ? "get_all_details" : null, // Track if order ID present
      needsOrderId: !orderId,
    };
  }

  // Check for general payment queries (how to pay, methods, etc.)
  if (paymentPatterns.some((pattern) => pattern.test(lowerQuery))) {
    return {
      intent: "payment_query",
      confidence: 0.85,
      orderId: null,
      tool: null, // Handle via RAG
    };
  }

  // Check for order tracking patterns (when no order ID detected yet)
  if (trackingPatterns.some((pattern) => pattern.test(lowerQuery))) {
    // Check for explicit tracking requests even without order ID
    const explicitTrackingWords =
      /track|where|status|location|eta|arrival|what.*my.*order/i;
    if (explicitTrackingWords.test(lowerQuery)) {
      return {
        intent: "track_order",
        confidence: 0.75,
        tool: "get_all_details",
        needsOrderId: true,
      };
    }
  }

  // Helper function to extract order ID for tool intents
  const getOrderIdFromQuery = (query) => {
    const orderIdPatterns = [
      /(?:order\s*(?:id|number|#)?\s*:?\s*)?(fm\d{5,})/i,
      /(?:order\s*(?:id|number|#)?\s*:?\s*)?(ord-?\d{4,})/i,
      /\b(fm\d{5,})\b/i,
      /\b(ord-?\d{4,})\b/i,
    ];

    for (const pattern of orderIdPatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
    return null;
  };

  // Check for specific tool intents
  if (driverPatterns.some((pattern) => pattern.test(lowerQuery))) {
    const orderId = getOrderIdFromQuery(query);
    return {
      intent: "get_driver_info",
      confidence: 0.85,
      orderId: orderId,
      tool: "get_driver_info",
      needsOrderId: !orderId,
    };
  }

  if (progressPatterns.some((pattern) => pattern.test(lowerQuery))) {
    const orderId = getOrderIdFromQuery(query);
    return {
      intent: "get_progress",
      confidence: 0.85,
      orderId: orderId,
      tool: "get_progress_tracking",
      needsOrderId: !orderId,
    };
  }

  if (routePatterns.some((pattern) => pattern.test(lowerQuery))) {
    const orderId = getOrderIdFromQuery(query);
    return {
      intent: "get_route",
      confidence: 0.85,
      orderId: orderId,
      tool: "get_route_info",
      needsOrderId: !orderId,
    };
  }

  if (orderDetailsPatterns.some((pattern) => pattern.test(lowerQuery))) {
    const orderId = getOrderIdFromQuery(query);
    return {
      intent: "get_order_details",
      confidence: 0.85,
      orderId: orderId,
      tool: "get_order_details",
      needsOrderId: !orderId,
    };
  }

  // Default: general query (use RAG)
  return {
    intent: "general_query",
    confidence: 0.5,
    tool: null,
  };
}

/**
 * Extract order ID from query - Enhanced with multiple patterns
 */
export function extractOrderId(query) {
  if (!query || typeof query !== "string") return null;

  const patterns = [
    /(?:order\s*(?:id|number|#)?\s*:?\s*)?(fm\d{5,})/i,
    /(?:order\s*(?:id|number|#)?\s*:?\s*)?(ord-?\d{4,})/i,
    /\b(fm\d{5,})\b/i, // Standalone FM with word boundaries
    /\b(ord-?\d{4,})\b/i, // Standalone ORD- with word boundaries
    /([a-z]{2}\d{5,})/i, // Generic format like FM100001
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1] && match[1].trim().length >= 5) {
      return match[1].toUpperCase().trim();
    }
  }

  return null;
}
