// In-memory session store (simple Tier 2 memory); can be swapped to Mongo later
const sessionMemory = new Map(); 

// Classify the type of issue based on query text
function classifyIssueType(text) {
  const t = String(text || "").toLowerCase().trim();
  
  // Check for greetings and introductions first
  if (/^(hello|hi|hey|good morning|good afternoon|good evening|greetings?)[\s,!]*$/i.test(t)) {
    return "greeting";
  }
  if (/^(who\s+are\s+you|what\s+is\s+your\s+name|your\s+name|introduce\s+yourself)/i.test(t)) {
    return "greeting";
  }
  
  // Check for out-of-context queries (not PayPal related)
  if (isOutOfContext(t)) {
    return "out_of_context";
  }
  
  // Check for actual PayPal issues
  if (/chargeback|dispute|case|resolution/.test(t)) return "dispute";
  if (/limit|limitation|restricted|hold/.test(t)) return "account_limitation";
  if (/fee|fees|charge|rate|pricing/.test(t)) return "fees";
  if (/refund|refunds|return/.test(t)) return "refund";
  if (/payment|transfer|send|receive|payout/.test(t)) return "payment_issue";
  
  // Default to general inquiry for unclear queries
  return "general_inquiry";
}

// Check if query is out of context (not PayPal related)
function isOutOfContext(text) {
  const t = String(text || "").toLowerCase();
  
  // Common non-PayPal topics
  const nonPayPalTopics = [
    /weather|temperature|rain|sunny/,
    /cooking|recipe|food|restaurant/,
    /sports|football|basketball|soccer/,
    /movie|film|cinema|entertainment/,
    /travel|vacation|hotel|flight/,
    /health|medical|doctor|hospital/,
    /education|school|university|study/,
    /job|career|employment|interview/,
    /car|vehicle|automobile|driving/,
    /shopping|store|retail|clothes/
  ];
  
  // If it matches non-PayPal topics and doesn't contain PayPal-related keywords
  const hasNonPayPalTopic = nonPayPalTopics.some(pattern => pattern.test(t));
  const hasPayPalKeywords = /paypal|payment|money|transaction|account|balance|wallet|fund/.test(t);
  
  return hasNonPayPalTopic && !hasPayPalKeywords;
}

// Get session state or create new one
function getSessionState(sessionId, issueType) {
  if (!sessionId) return null;
  
  const state = sessionMemory.get(sessionId) || { messages: [], issueType };
  state.issueType = state.issueType || issueType;
  return state;
}

// Update session with new message
function updateSession(sessionId, query, issueType) {
  if (!sessionId) return;
  
  const state = getSessionState(sessionId, issueType);
  if (state) {
    state.messages.push({ role: "user", content: query });
    sessionMemory.set(sessionId, state);
  }
}

// Check if query should trigger agent introduction
function shouldIntroduceAgent(query) {
  const lowerQ = String(query || "").toLowerCase().trim();
  
  // Simple greetings
  if (/^(hello|hi|hey|good morning|good afternoon|good evening|greetings?)[\s,!]*$/i.test(lowerQ)) {
    return true;
  }
  
  // Direct questions about the agent
  const introduceTriggers = [
    /what\s+is\s+your\s+name/,
    /who\s+are\s+you/,
    /your\s+name\??/,
    /introduce\s+yourself/,
    /agent[,!\s]*\b/,
  ];
  return introduceTriggers.some((re) => re.test(lowerQ));
}

// Generate system instruction based on context
function generateSystemInstruction(agentName, shouldIntroduce, sentiment, sawProfanity) {
  let systemInstruction = `You are ${agentName}, a helpful PayPal customer support agent.`;
  
  if (shouldIntroduce) {
    systemInstruction += ` The user has greeted you or asked about you. Respond warmly and briefly introduce yourself as ${agentName}, then ask how you can help them with their PayPal-related questions.`;
  } else {
    systemInstruction += ` Do not introduce yourself unless explicitly asked or greeted.`;
  }
  
  if (sentiment.sentiment === "frustrated" || sawProfanity) {
    systemInstruction += ` The customer may be upset. Start with one short, kind, de‑escalating sentence (empathetic and professional), avoid mirroring aggression, then provide a clear helpful answer.`;
  } else if (sentiment.sentiment === "concerned") {
    systemInstruction += ` The customer is concerned. Be reassuring and calm.`;
  }
  
  return systemInstruction;
}

module.exports = {
  classifyIssueType,
  isOutOfContext,
  getSessionState,
  updateSession,
  shouldIntroduceAgent,
  generateSystemInstruction
};
