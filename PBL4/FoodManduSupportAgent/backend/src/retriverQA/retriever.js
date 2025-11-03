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

// Infer topic from query for metadata boosting
function inferTopicFromQuery(query) {
  const lowerQuery = query.toLowerCase();
  if (
    /payment|pay|bill|cost|price|esewa|khalti|wallet|cod|cash/.test(lowerQuery)
  )
    return "payment";
  if (/refund|money.*back|return.*payment|cancel.*order/.test(lowerQuery))
    return "refund";
  if (
    /delivery|deliver|area|coverage|zone|location|address|available.*area/.test(
      lowerQuery
    )
  )
    return "delivery";
  if (
    /restaurant|partner|menu|update.*menu|pause.*order|business/.test(
      lowerQuery
    )
  )
    return "restaurant";
  if (/order|place.*order|how.*to.*order|ordering/.test(lowerQuery))
    return "ordering";
  if (/track|status|where|eta|time|delay/.test(lowerQuery)) return "support";
  if (/contact|phone|email|help|support/.test(lowerQuery)) return "contact";
  return null; // No specific topic detected
}

// --- Hybrid Search: Semantic + Keyword + Topic Boosting ---
export async function hybridSearch(query, topK = 5, options = {}) {
  if (!query || typeof query !== "string") {
    throw new Error("Invalid query for retrieval");
  }

  if (topK < 1 || topK > 10) {
    throw new Error("topK must be between 1 and 10");
  }

  try {
    // Infer topic from query for relevance boosting
    const inferredTopic = options.topic || inferTopicFromQuery(query);

    // 1. Semantic search (vector similarity)
    const queryEmbedding = await getGeminiEmbedding(query);
    const semanticResults = await index.query({
      vector: queryEmbedding,
      topK: topK + 2, // Get 2 extra results for reranking (was 2x)
      includeMetadata: true,
      // Optional: filter by metadata if strict filtering is desired
      // filter: inferredTopic ? { topic: { $eq: inferredTopic } } : undefined,
    });

    // 2. Keyword search (extract key terms from query)
    const keywords = extractKeywords(query);

    // Combine results with scores
    const scoredResults = (semanticResults.matches || []).map((match) => {
      const text = (match.metadata?.text || "").toLowerCase();
      const url = (match.metadata?.url || "").toLowerCase();
      const metadataTopic = match.metadata?.topic || "";

      // Calculate keyword match score
      let keywordScore = 0;
      keywords.forEach((keyword) => {
        if (text.includes(keyword) || url.includes(keyword)) {
          keywordScore += 1;
        }
      });

      // Normalize keyword score (0 to 1)
      const normalizedKeywordScore = Math.min(
        keywordScore / keywords.length,
        1
      );

      // Topic boosting: add bonus if metadata topic matches inferred topic
      const topicBoost =
        inferredTopic && metadataTopic === inferredTopic ? 0.15 : 0;

      // Combine semantic score (60%), keyword score (25%), topic boost (15%)
      const combinedScore =
        match.score * 0.6 + normalizedKeywordScore * 0.25 + topicBoost;

      return {
        ...match,
        keywordScore,
        topicBoost,
        combinedScore,
      };
    });

    // Sort by combined score and take topK
    const topResults = scoredResults
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, topK);

    // Log topic boost info for debugging
    if (inferredTopic) {
      console.log(`📊 Topic inferred: ${inferredTopic}`);
      const boostedCount = topResults.filter((r) => r.topicBoost > 0).length;
      if (boostedCount > 0) {
        console.log(
          `✨ ${boostedCount}/${topResults.length} results boosted by topic match`
        );
      }
    }

    const sections = topResults
      .map((m) => m.metadata?.text || "")
      .filter(Boolean);

    return sections;
  } catch (error) {
    console.error("❌ Hybrid retrieval failed:", error.message);
    throw new Error(`Failed to retrieve context: ${error.message}`);
  }
}

// --- Extract Keywords from Query ---
function extractKeywords(query) {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "should",
    "could",
    "may",
    "might",
    "must",
    "can",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "what",
    "which",
    "who",
    "when",
    "where",
    "why",
    "how",
    "my",
    "your",
    "his",
    "her",
    "its",
    "our",
    "their",
    "म",
    "तिमी",
    "हाम्रो",
    "तपाईं",
    "यो",
    "त्यो",
    "के",
    "कसरी",
  ]);

  return query
    .toLowerCase()
    .split(/[\s.,;:!?()]+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 10); // Max 10 keywords
}

// --- Retrieve Top Context Sections (backward compatible) ---
export async function retrieveTopSections(query, topK = 3) {
  // Use hybrid search by default
  return await hybridSearch(query, topK);
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

    // Language-specific prompts with empathetic tone
    const languagePrompts = {
      en: `You are a helpful, friendly, and empathetic Foodmandu support assistant. Your goal is to help users with their questions about Foodmandu services, especially when they're hungry and waiting for their orders.

IMPORTANT TONE GUIDELINES:
- Be warm and understanding, especially for delivery delays
- Show empathy: "I understand you're hungry and waiting..."
- Provide clear next steps and reassurance
- For late orders, acknowledge frustration: "I know waiting is frustrating..."
- For payment issues, be patient and helpful: "Let me help you resolve this..."
- Always end with positive action: "I'm here to help!"

${
  contextSections.length > 0
    ? `Use the following context from our documentation to provide accurate answers:\n\nContext:\n${context}\n\nQuestion: ${question}\n\nPlease provide a clear, empathetic, and helpful answer in English based on the context above.`
    : `Question: ${question}\n\nPlease provide a clear, helpful, and comprehensive answer in English using your general knowledge about food delivery, restaurants, Nepal, or any other relevant information.`
}`,

      np: `तपाईं एक सहायक, मित्रवत् र सहानुभूतिपूर्ण Foodmandu सहायता सहायक हुनुहुन्छ। तपाईंको लक्ष्य Foodmandu सेवाहरूको बारेमा प्रयोगकर्ताहरूको प्रश्नहरूमा मद्दत गर्नु हो, विशेष गरी जब तिनीहरू भोकाएका छन् र आफ्नो अर्डरको लागि पर्खिरहेका छन्।

महत्वपूर्ण स्वर निर्देशन:
- न्यानो र समझदार बन्नुहोस्, विशेष गरी डेलिभरी ढिलाइको लागि
- सहानुभूति देखाउनुहोस्: "म बुझ्छु तपाईं भोकाएको छ र पर्खिरहनुभएको छ..."
- स्पष्ट अर्को चरण र आश्वासन प्रदान गर्नुहोस्
- ढिलो अर्डरको लागि, निराशा स्वीकार गर्नुहोस्: "मलाई थाहा छ पर्खनु निराशाजनक छ..."
- भुक्तानी समस्याको लागि, धैर्यवान र सहायक बन्नुहोस्: "म तपाईंलाई यो समाधान गर्न मद्दत गर्छु..."
- सधैं सकारात्मक कार्यको साथ अन्त्य गर्नुहोस्: "म तपाईंलाई मद्दत गर्न यहाँ छु!"

${
  contextSections.length > 0
    ? `हाम्रो कागजातबाट सही जवाफहरू प्रदान गर्न निम्नलिखित सन्दर्भ प्रयोग गर्नुहोस्:\n\nसन्दर्भ:\n${context}\n\nप्रश्न: ${question}\n\nकृपया नेपालीमा स्पष्ट, सहानुभूतिपूर्ण र सहायक जवाफ प्रदान गर्नुहोस् र माथिको सन्दर्भमा आधारित भएर।`
    : `प्रश्न: ${question}\n\nकृपया नेपालीमा स्पष्ट, सहायक र विस्तृत जवाफ प्रदान गर्नुहोस् आफ्नो सामान्य ज्ञान प्रयोग गरेर खाना वितरण, रेस्टुरेन्ट, नेपाल वा कुनै अन्य सम्बन्धित जानकारीको बारेमा।`
}`,
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
          temperature: 0.5, // Reduced from 0.7 for faster, more focused responses
          maxOutputTokens: 512, // Reduced from 1024 for faster responses
          topP: 0.9, // Reduced from 0.95 for faster sampling
          topK: 32, // Reduced from 40 for faster generation
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
