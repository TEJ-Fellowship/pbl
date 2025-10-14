//embedding-and storing in pinecone , also added little bit of sentiment analysis
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import readline from "readline";

dotenv.config();

//CONFIG  
const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TOP_K = 3; //number of similar chunks to retrieve

if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env file");
  console.error("Get your free API key at: https://makersuite.google.com/app/apikey");
  process.exit(1);
}

//SENTIMENT KEYWORDS
const FRUSTRATED_KEYWORDS = [
  "frustrated", "angry", "upset", "terrible", "worst", "useless",
  "horrible", "awful", "hate", "stupid", "ridiculous", "pathetic",
  "waste", "scam", "fraud", "unacceptable", "disgusted", "fed up",
  "furious", "outraged", "disappointed", "complaint"
];

//UTILITIES
function detectSentiment(text) {
  const lowerText = text.toLowerCase();
  const frustratedCount = FRUSTRATED_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword)
  ).length;
  
  const hasExcessivePunctuation = /[!?]{2,}/.test(text);
  const capsWords = text.split(" ").filter(word => 
    word.length > 3 && word === word.toUpperCase()
  ).length;
  
  const score = frustratedCount + (hasExcessivePunctuation ? 1 : 0) + (capsWords > 2 ? 1 : 0);
  
  if (score >= 2) return { sentiment: "frustrated", confidence: "high", score };
  if (score === 1) return { sentiment: "concerned", confidence: "medium", score };
  return { sentiment: "neutral", confidence: "high", score };
}

function parseContent(preview) {
  try {
    const parsed = JSON.parse(preview);
    if (parsed.questions && Array.isArray(parsed.questions)) {
      return parsed.questions.map(q => q.content).join("\n\n");
    }
    if (parsed.content) return parsed.content;
    if (parsed.text) return parsed.text;
    return JSON.stringify(parsed);
  } catch {
    return preview;
  }
}

async function generateAnswer(query, chunks, sentiment, genAI) {
  if (!chunks || chunks.length === 0) {
    return "I couldn't find relevant information in the knowledge base. Please contact PayPal support directly.";
  }
  
  // Prepare context from retrieved chunks
  const context = chunks.map((chunk, idx) => {
    const content = parseContent(chunk.metadata.preview);
    return `[Source ${idx + 1}]: ${content}`;
  }).join("\n\n");
  
  // Build system prompt based on sentiment
  let systemInstruction = `You are a helpful PayPal customer support agent. Answer questions clearly and concisely based on the provided context.`;
  
  if (sentiment.sentiment === "frustrated") {
    systemInstruction += ` The customer appears frustrated. Be extra empathetic, apologize for their inconvenience, and provide clear, actionable steps. Start with an empathetic acknowledgment.`;
  } else if (sentiment.sentiment === "concerned") {
    systemInstruction += ` The customer seems concerned. Be reassuring and thorough in your explanation.`;
  }
  
  const prompt = `${systemInstruction}

Context from PayPal documentation:
${context}

Customer Question: ${query}

Please provide a clear, helpful answer (2-3 paragraphs maximum) based on the context above. Be conversational and friendly. If the context doesn't fully answer the question, mention that and suggest contacting PayPal support.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini:", error.message);
    return parseContent(chunks[0].metadata.preview);
  }
}

//MAIN FUNCTION
async function main() {
  console.log("Initializing PayPal Support Agent with RAG (Gemini)...\n");
  
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  const index = pinecone.index(PINECONE_INDEX);
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  console.log("Loading embedding model...");
  const embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");
  console.log("Model loaded!\n");
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log("=".repeat(60));
  console.log("PayPal Customer Support Q&A Agent (RAG + Gemini)");
  console.log("=".repeat(60));
  console.log("Ask me anything about PayPal! (Type 'exit' to quit)\n");
  
  const askQuestion = () => {
    rl.question("Your question: ", async (query) => {
      if (query.toLowerCase() === "exit" || query.toLowerCase() === "quit") {
        console.log("\n Thank you for using PayPal Support Agent. Goodbye!");
        rl.close();
        process.exit(0);
      }
      
      if (!query.trim()) {
        console.log("Please enter a valid question.\n");
        askQuestion();
        return;
      }
      
      try {
        console.log("\n Searching knowledge base...");
        
        const sentiment = detectSentiment(query);
        if (sentiment.sentiment === "frustrated") {
          console.log("ALERT: Frustrated customer detected! Priority support needed.");
          console.log(`   Sentiment Score: ${sentiment.score} | Confidence: ${sentiment.confidence}\n`);
        } else if (sentiment.sentiment === "concerned") {
          console.log("Customer may be concerned. Handle with care.\n");
        }
        
        const output = await embedder(query, { pooling: "mean", normalize: true });
        const queryEmbedding = Array.from(output.data);
        
        const searchResults = await index.namespace(PINECONE_NAMESPACE).query({
          vector: queryEmbedding,
          topK: TOP_K,
          includeMetadata: true
        });
        
        console.log("Generating answer with Gemini...\n");
        
        const answer = await generateAnswer(query, searchResults.matches, sentiment, genAI);
        
        console.log("Answer:");
        console.log("-".repeat(60));
        console.log(answer);
        console.log("-".repeat(60));
        
        if (searchResults.matches.length > 0) {
          console.log(`\n Confidence: ${(searchResults.matches[0].score * 100).toFixed(1)}%`);
          console.log(` Retrieved from: ${searchResults.matches[0].metadata.source}`);
        }
        
        console.log("\n");
        askQuestion();
        
      } catch (error) {
        console.error("Error processing query:", error.message);
        console.log("\n");
        askQuestion();
      }
    });
  };
  
  askQuestion();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});