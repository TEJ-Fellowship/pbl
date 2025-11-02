/**
 * AI-powered query enhancement for better documentation search
 * Intelligently expands queries to improve search relevance
 * This happens AFTER classification, before documentation search
 */

/**
 * Enhance query using AI for better documentation search results
 * @param {string} query - Original user query
 * @param {object} classification - Classification result from QueryRouter
 * @param {object} genAI - Google Generative AI instance
 * @returns {Promise<string>} - Enhanced query for search
 */
async function enhanceQueryForSearch(query, classification, genAI) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const issueType =
      classification.primary_issue_type ||
      classification.issue_type?.[0] ||
      null;

    const queryType = classification.query_type || "unknown";

    const enhancementPrompt = `You are a query enhancement expert for a PayPal documentation search system.

Your task: Enhance the user's query to improve search results in PayPal documentation while preserving the original intent.

Original user query: "${query}"
Query type: ${queryType}
Issue type: ${issueType || "not specified"}

CRITICAL RULES:
- If the query mentions "Braintree", you MUST preserve "Braintree" in the enhanced query. Do NOT remove or replace it.
- If the query mentions specific products/services like "Braintree", "Venmo", "PayPal", keep them exactly as written.
- For Braintree queries, include variations like "Braintree fee", "Braintree transaction", "Braintree payment processing"

Analyze the query and create an enhanced search query that:
1. Preserves the original intent and meaning
2. CRITICAL: If query mentions "Braintree", ensure "Braintree" is prominently included in enhanced query
3. Includes relevant synonyms and related terms that would appear in documentation
4. For fee queries: include terms like "fee", "charge", "rate", "percentage", payment methods, account types, transaction types
   - For donation fee queries: include "donation", "donate", "charity", "donation fees", "PayPal consumer fees"
   - For consumer fee queries: include "consumer fees", "PayPal consumer fees", "personal account fees", "consumer", "consumer account"
   - CRITICAL: For ANY fee query that does NOT explicitly mention "merchant" or "Braintree", ALWAYS add "PayPal consumer fees" to the enhanced query
5. For "all" or "complete" requests: include terms that would match comprehensive information (e.g., "all fee tables", "complete fee structure")
6. For specific scenarios (e.g., "US to Australia"): include both specific and general terms (e.g., "international", "sending money", "cross-border", "personal account")
7. Keep technical terms and proper nouns as-is (e.g., "PayPal", "Braintree", "Venmo", "Australia", "USD", "AUD")
8. Include common variations that documentation might use
9. For policy/procedure queries: include related terms that might appear in documentation

Return ONLY the enhanced search query, nothing else. Do not add explanations, notes, or metadata.
Just return the enhanced query text that will be used for semantic and lexical search.`;

    const result = await model.generateContent(enhancementPrompt);
    const response = await result.response;
    let enhancedQuery = response.text().trim();

    // Clean up: remove quotes, explanations, or extra text
    enhancedQuery = enhancedQuery.replace(/^["']|["']$/g, ""); // Remove surrounding quotes
    enhancedQuery = enhancedQuery.split("\n")[0].trim(); // Take first line only (in case of explanations)

    // Remove common prefixes like "Enhanced query:" or "Query:"
    enhancedQuery = enhancedQuery
      .replace(/^(enhanced\s+query|query):\s*/i, "")
      .trim();

    // Fallback to original if enhancement seems invalid
    if (!enhancedQuery || enhancedQuery.length < query.length * 0.3) {
      console.log("⚠️ Query enhancement seems invalid, using original");
      return query;
    }

    return enhancedQuery;
  } catch (error) {
    console.error(
      "❌ Query enhancement failed, using original:",
      error.message
    );
    return query;
  }
}

module.exports = { enhanceQueryForSearch };
