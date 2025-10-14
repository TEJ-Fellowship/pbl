const dotenv = require("dotenv");
const { logConversation } = require("../db.js");

// Import modular services
const { detectSentiment, containsProfanity } = require("./sentiment");
const { performHybridSearch } = require("./searchService");
const { 
  classifyIssueType, 
  updateSession, 
  shouldIntroduceAgent, 
  generateSystemInstruction 
} = require("./sessionManager");
const { 
  formatStructuredResponse, 
  shouldIncludeDisclaimer, 
  generateCitations, 
  buildContext, 
  calculateConfidence, 
  prepareLoggingCitations 
} = require("./responseFormatter");

dotenv.config();

const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AGENT_NAME = process.env.AGENT_NAME || "Ashok Limbu";
const TOP_K = 3;

async function handleQuery(query, sessionId) {
  const { Pinecone } = await import("@pinecone-database/pinecone");
  const { pipeline } = await import("@xenova/transformers");
  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pinecone.index(PINECONE_INDEX);
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");

  // Analyze sentiment and classify issue
  const sentiment = await detectSentiment(query, genAI);
  const issueType = classifyIssueType(query);
  
  // Update session if sessionId provided
  updateSession(sessionId, query, issueType);

  // Generate query embedding
  const output = await embedder(query, { pooling: "mean", normalize: true });
  const queryEmbedding = Array.from(output.data);

  // Perform hybrid search
  const topResults = await performHybridSearch(queryEmbedding, query, index, PINECONE_NAMESPACE, TOP_K);

  // Handle greetings and out-of-context queries even without search results
  if (topResults.length === 0) {
    if (issueType === "greeting") {
      const shouldIntroduce = shouldIntroduceAgent(query);
      const systemInstruction = generateSystemInstruction(AGENT_NAME, shouldIntroduce, sentiment, false);
      const prompt = `${systemInstruction}\n\nCustomer: ${query}\n`;
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const modelAnswer = response.text();
      
      return { 
        answer: modelAnswer, 
        sentiment, 
        confidence: 100,
        citations: [],
        issueType,
        disclaimer: false
      };
    }
    
    if (issueType === "out_of_context") {
      const systemInstruction = `You are ${AGENT_NAME}, a PayPal customer support agent. The user has asked something unrelated to PayPal. Politely redirect them to PayPal-related topics and ask how you can help with their PayPal account or services.`;
      const prompt = `${systemInstruction}\n\nCustomer: ${query}\n`;
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const modelAnswer = response.text();
      
      return { 
        answer: modelAnswer, 
        sentiment, 
        confidence: 100,
        citations: [],
        issueType,
        disclaimer: false
      };
    }
    
    return { answer: "No relevant info found. Please contact PayPal support.", sentiment };
  }

  // Build context and determine response parameters
  const context = buildContext(topResults);
  const shouldIntroduce = shouldIntroduceAgent(query);
  const sawProfanity = containsProfanity(query);
  const includeDisclaimer = shouldIncludeDisclaimer(topResults, query);

  // Generate system instruction
  const systemInstruction = generateSystemInstruction(AGENT_NAME, shouldIntroduce, sentiment, sawProfanity);

  // Generate AI response
  const prompt = `${systemInstruction}\n\nContext:\n${context}\n\nCustomer: ${query}\n`;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const modelAnswer = response.text();

  // Format final response
  const finalAnswer = formatStructuredResponse(issueType, includeDisclaimer, modelAnswer);

  // Log conversation (fire-and-forget)
  logConversation({
    sessionId: sessionId || null,
    query,
    issueType,
    sentiment,
    topCitations: prepareLoggingCitations(topResults),
  });

  return {
    answer: finalAnswer,
    sentiment,
    confidence: calculateConfidence(topResults),
    citations: generateCitations(topResults),
    issueType,
    disclaimer: includeDisclaimer,
  };
}

module.exports = { handleQuery };
