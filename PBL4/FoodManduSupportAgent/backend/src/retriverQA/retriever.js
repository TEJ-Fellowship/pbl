import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

// Initialize Pinecone
let pinecone, index;
try {
  pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  index = pinecone.index(process.env.PINECONE_INDEX_NAME);
} catch (error) {
  console.error("❌ Failed to initialize Pinecone:", error.message);
  throw error;
}

// --- Gemini Embedding ---
async function getGeminiEmbedding(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text input for embedding");
  }

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=" +
    process.env.GOOGLE_GEMINI_API_KEY;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || JSON.stringify(data);
      throw new Error(`Gemini API error: ${errorMessage}`);
    }

    const embedding = data.embedding?.values || data.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Invalid embedding response from Gemini API");
    }

    return embedding;
  } catch (error) {
    console.error("❌ Embedding generation failed:", error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

// --- Retrieve Top Context Sections ---
export async function retrieveTopSections(query, topK = 3) {
  if (!query || typeof query !== "string") {
    throw new Error("Invalid query for retrieval");
  }

  if (topK < 1 || topK > 10) {
    throw new Error("topK must be between 1 and 10");
  }

  try {
    const queryEmbedding = await getGeminiEmbedding(query);

    const result = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    const sections = (result.matches || [])
      .map((m) => m.metadata?.text || "")
      .filter(Boolean);

    return sections;
  } catch (error) {
    console.error("❌ Retrieval failed:", error.message);
    throw new Error(`Failed to retrieve context: ${error.message}`);
  }
}

// --- Ask Gemini ---
export async function askGemini(question, contextSections, language = "en") {
  if (!question || typeof question !== "string") {
    throw new Error("Invalid question for Gemini");
  }

  if (!Array.isArray(contextSections)) {
    throw new Error("Context sections must be an array");
  }

  try {
    const context =
      contextSections.length > 0
        ? contextSections.join("\n\n")
        : "No specific context available.";

    // Language-specific prompts
    const languagePrompts = {
      en: `You are a helpful and friendly Foodmandu support assistant. Your goal is to help users with their questions about Foodmandu services.

${
  contextSections.length > 0
    ? `Use the following context from our documentation to provide accurate answers:\n\nContext:\n${context}\n\n`
    : ""
}Question: ${question}

Please provide a clear, concise, and helpful answer in English. If the information is not available in the context, politely let the user know and suggest contacting support.`,

      np: `तपाईं एक सहायक र मित्रवत् Foodmandu सहायता सहायक हुनुहुन्छ। तपाईंको लक्ष्य Foodmandu सेवाहरूको बारेमा प्रयोगकर्ताहरूको प्रश्नहरूमा मद्दत गर्नु हो।

${
  contextSections.length > 0
    ? `हाम्रो कागजातबाट सही जवाफहरू प्रदान गर्न निम्नलिखित सन्दर्भ प्रयोग गर्नुहोस्:\n\nसन्दर्भ:\n${context}\n\n`
    : ""
}प्रश्न: ${question}

कृपया नेपालीमा स्पष्ट, संक्षिप्त र सहायक जवाफ प्रदान गर्नुहोस्। यदि जानकारी सन्दर्भमा उपलब्ध छैन भने, विनम्रतापूर्वक प्रयोगकर्तालाई थाहा दिनुहोस् र सहायतासँग सम्पर्क गर्न सुझाव दिनुहोस्।`,
    };

    const prompt = languagePrompts[language] || languagePrompts.en;

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" +
      process.env.GOOGLE_GEMINI_API_KEY;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || JSON.stringify(data);
      throw new Error(`Gemini API error: ${errorMessage}`);
    }

    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      throw new Error("No answer generated from Gemini API");
    }

    return answer;
  } catch (error) {
    console.error("❌ Gemini generation failed:", error.message);
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
}
