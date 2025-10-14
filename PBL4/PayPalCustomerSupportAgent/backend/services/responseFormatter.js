// Format structured response with issue type and disclaimer
function formatStructuredResponse(issueType, includeDisclaimer, rawAnswer) {
  const disclaimer = includeDisclaimer
    ? "This is general guidance based on PayPal documentation. For account‑specific issues or legal advice, please contact PayPal support."
    : "";
  
  // For greetings and out-of-context queries, just return the raw answer without issue header
  if (issueType === "greeting" || issueType === "out_of_context") {
    return rawAnswer;
  }
  
  // For other types, include issue header
  return [
    `Issue: ${issueType.replace(/_/g, " ")}`,
    rawAnswer,
    disclaimer && `Disclaimer: ${disclaimer}`
  ].filter(Boolean).join("\n\n");
}

// Determine if disclaimer should be included
function shouldIncludeDisclaimer(topResults, query) {
  const lowConfidence = (topResults[0]?.combined || 0) < 0.5;
  const legalQuery = /account|legal|attorney|law|court|subpoena/i.test(query);
  return lowConfidence || legalQuery;
}

// Generate citations from search results
function generateCitations(topResults) {
  return topResults.map((c, idx) => ({
    label: `Source ${idx + 1}`,
    source: c.source || "docs",
    isPolicy: !!c.isPolicy,
    channel: c.from,
  }));
}

// Build context string from search results
function buildContext(topResults) {
  return topResults.map((c, idx) => `[Source ${idx + 1}] (${c.source || "docs"}): ${c.text}`).join("\n\n");
}

// Calculate confidence score from top result
function calculateConfidence(topResults) {
  return Math.min(100, Math.max(0, Math.round((topResults[0]?.combined || 0) * 100)));
}

// Prepare citations for logging
function prepareLoggingCitations(topResults) {
  return topResults.map((c) => ({ 
    source: c.source, 
    channel: c.from, 
    isPolicy: c.isPolicy, 
    score: c.combined 
  }));
}

module.exports = {
  formatStructuredResponse,
  shouldIncludeDisclaimer,
  generateCitations,
  buildContext,
  calculateConfidence,
  prepareLoggingCitations
};
