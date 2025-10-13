import "dotenv/config";
import inquirer from "inquirer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHybridRetriever } from "./hybrid-retriever.js";
import { embedSingle } from "./utils/embeddings.js";
import { connectDB, disconnectDB } from "../config/db.js";
import BufferWindowMemory from "./memory/BufferWindowMemory.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import MarkdownIt from "markdown-it";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize markdown renderer
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// Confidence scoring function
function calculateConfidence(results, answer) {
  let confidence = 0;
  let confidenceFactors = [];

  // Factor 1: Number of relevant sources (0-25 points)
  const sourceCount = results.length;
  if (sourceCount >= 4) {
    confidence += 25;
    confidenceFactors.push("Multiple relevant sources found");
  } else if (sourceCount >= 2) {
    confidence += 15;
    confidenceFactors.push("Several relevant sources found");
  } else if (sourceCount >= 1) {
    confidence += 10;
    confidenceFactors.push("Limited sources found");
  }

  // Factor 2: Average relevance score (0-25 points)
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;
  if (avgScore >= 0.7) {
    confidence += 25;
    confidenceFactors.push("High relevance scores");
  } else if (avgScore >= 0.5) {
    confidence += 20;
    confidenceFactors.push("Good relevance scores");
  } else if (avgScore >= 0.3) {
    confidence += 15;
    confidenceFactors.push("Moderate relevance scores");
  } else {
    confidence += 5;
    confidenceFactors.push("Low relevance scores");
  }

  // Factor 3: Answer quality indicators (0-25 points)
  const answerLength = answer.length;
  const hasCodeBlocks = answer.includes("```") || answer.includes("`");
  const hasSpecifics =
    answer.includes("API") ||
    answer.includes("endpoint") ||
    answer.includes("parameter");

  if (answerLength > 200 && hasSpecifics) {
    confidence += 25;
    confidenceFactors.push("Detailed answer with specific information");
  } else if (answerLength > 100 && (hasCodeBlocks || hasSpecifics)) {
    confidence += 20;
    confidenceFactors.push("Good answer with technical details");
  } else if (answerLength > 100) {
    confidence += 15;
    confidenceFactors.push("Good answer for moderate query");
  } else {
    confidence += 10;
    confidenceFactors.push("Basic answer provided");
  }

  // Factor 4: Search method diversity (0-25 points)
  const searchTypes = [...new Set(results.map((r) => r.searchType))];
  if (searchTypes.length >= 2) {
    confidence += 25;
    confidenceFactors.push("Multiple search methods used");
  } else {
    confidence += 15;
    confidenceFactors.push("Single search method used");
  }

  // Determine confidence level
  let confidenceLevel;
  if (confidence >= 80) {
    confidenceLevel = "High";
  } else if (confidence >= 60) {
    confidenceLevel = "Medium";
  } else {
    confidenceLevel = "Low";
  }

  return {
    score: Math.min(confidence, 100),
    level: confidenceLevel,
    factors: confidenceFactors,
  };
}

// Format response with confidence and sources
function formatResponse(answer, results, confidence) {
  const confidenceColor =
    confidence.level === "High"
      ? "🟢"
      : confidence.level === "Medium"
      ? "🟡"
      : "🟠";

  let formattedResponse = `<p>${confidenceColor} <strong>Confidence: ${confidence.level}</strong> (${confidence.score}/100)</p>\n`;
  formattedResponse += `<p><em>Based on: ${confidence.factors.join(
    ", "
  )}</em></p>\n`;

  // Format the answer with markdown
  const formattedAnswer = md.render(answer);
  formattedResponse += formattedAnswer;

  // Add source citation
  if (results.length > 0) {
    const primarySource = results[0];
    formattedResponse += `\n<p>(Source: [Source ${1}] ${
      primarySource.metadata?.title || "Unknown"
    })</p>`;
  }

  formattedResponse += "\n<hr>\n";
  formattedResponse += "<p><strong>Sources:</strong></p>\n<ol>\n";

  results.forEach((result, i) => {
    const sourceTitle = result.metadata?.title || "Unknown";
    const score = result.score.toFixed(3);
    const searchType = result.searchType;
    formattedResponse += `<li><strong>${sourceTitle}</strong> (Score: ${score}, ${searchType})</li>\n`;
  });

  formattedResponse += "</ol>";

  return formattedResponse;
}

// Handle edge cases with fallback responses
function handleEdgeCases(results, question) {
  if (results.length === 0) {
    return {
      answer:
        "I couldn't find this information in the available documentation. Please try rephrasing your question or contact Shopify support for assistance.",
      confidence: { score: 0, level: "Low", factors: ["No sources found"] },
      isEdgeCase: true,
    };
  }

  // Check for very low relevance scores
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;
  if (avgScore < 0.2) {
    return {
      answer:
        "I found some related information, but it may not directly answer your question. Please try rephrasing your question with more specific terms or contact Shopify support for assistance.",
      confidence: {
        score: 20,
        level: "Low",
        factors: ["Very low relevance scores"],
      },
      isEdgeCase: true,
    };
  }

  return null; // No edge case detected
}

// Validate prerequisites before starting
async function validateSetup() {
  const errors = [];

  // Check for API keys
  if (!process.env.GEMINI_API_KEY) {
    errors.push("❌ Missing GEMINI_API_KEY in .env file");
  }

  if (!process.env.PINECONE_API_KEY) {
    errors.push("❌ Missing PINECONE_API_KEY in .env file");
  }

  // Check MongoDB connection
  try {
    await connectDB();
    console.log("✅ MongoDB connection validated");
  } catch (error) {
    errors.push(`❌ MongoDB connection failed: ${error.message}`);
  }

  // Check if Pinecone index exists and has data
  try {
    const { getPineconeIndex } = await import("../config/pinecone.js");
    const index = await getPineconeIndex();

    // Check if index has data
    const stats = await index.describeIndexStats();
    if (stats.totalVectorCount === 0) {
      errors.push(
        "❌ Pinecone index is empty. Run 'npm run ingest' to populate it with data."
      );
    } else {
      console.log(`✅ Pinecone index has ${stats.totalVectorCount} vectors`);
    }
  } catch (error) {
    errors.push(`❌ Pinecone connection failed: ${error.message}`);
  }

  // Note: We're using Pinecone vector database, so local scraped docs are not required
  // The validation above already checked that Pinecone has data

  if (errors.length > 0) {
    console.error("\n⚠️  Setup Issues Detected:\n");
    errors.forEach((err) => console.error(err));
    console.error("\n📋 Setup Instructions:");
    console.error("1. Create a .env file with:");
    console.error("   GEMINI_API_KEY=your_gemini_key_here");
    console.error("   PINECONE_API_KEY=your_pinecone_key_here");
    console.error("   PINECONE_INDEX_NAME=shopify-merchant-support");
    console.error(
      "2. Get your Gemini API key from: https://aistudio.google.com/app/apikey"
    );
    console.error(
      "3. Get your Pinecone API key from: https://app.pinecone.io/"
    );
    console.error(
      "4. Ensure your Pinecone index has data (run 'npm run ingest' if needed)"
    );
    console.error("5. Run: npm run chat\n");
    process.exit(1);
  }
}

async function main() {
  console.log("🔍 Validating setup...\n");
  await validateSetup();

  console.log("✅ Setup validated successfully!\n");
  console.log(
    "🤖 Loading Shopify Merchant Support Agent with Hybrid Search + Conversation History...\n"
  );

  // Initialize conversation memory with token-aware windowing
  const memory = new BufferWindowMemory({
    windowSize: 8, // Last 8 messages (4 turns)
    sessionId: `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    maxTokens: 6000, // Maximum tokens for context
    modelName: "gemini-1.5-flash",
    prioritizeRecent: true,
    prioritizeRelevance: true,
  });

  await memory.initializeConversation();

  const retriever = await createHybridRetriever({
    semanticWeight: 0.6, // Balanced weights for better diversity
    keywordWeight: 0.4, // Increased keyword weight for better exact matching
    maxResults: 15, // Get more results for better fusion
    finalK: 6, // Return more results for comprehensive answers
    diversityBoost: 0.1, // Boost for category diversity
  });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Use correct model name - gemini-1.5-flash is more reliable
  // Choose model from env or default to a reliable one.
  let modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  console.log(`Using model: ${modelName}\n`);

  let model;
  try {
    model = genAI.getGenerativeModel({ model: modelName });
  } catch (err) {
    // Silent fallback: if initial model isn't available, try gemini-1.5-flash
    if (modelName !== "gemini-1.5-flash") {
      try {
        modelName = "gemini-1.5-flash";
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Falling back to model: ${modelName}\n`);
      } catch (err2) {
        console.error(
          `❌ Failed to initialize any Gemini model: ${
            err2.message || err.message
          }`
        );
        process.exit(1);
      }
    } else {
      console.error(`❌ Failed to initialize Gemini model: ${err.message}`);
      process.exit(1);
    }
  }

  console.log(
    "Shopify Merchant Support (Tier 2) — Hybrid RAG Chat + Conversation History"
  );
  console.log(
    "Type 'exit' to quit, 'stats' for search statistics, 'clear' to clear conversation history.\n"
  );
  console.log("─".repeat(60));

  while (true) {
    console.log();
    const { question } = await inquirer.prompt([
      {
        name: "question",
        type: "input",
        message: "Ask a question:",
        validate: (input) =>
          input.trim().length > 0 || "Please enter a question",
      },
    ]);

    if (!question || question.toLowerCase() === "exit") break;

    // Handle stats command
    if (question.toLowerCase() === "stats") {
      const retrieverStats = retriever.getStats();
      const memoryStats = await memory.getStats();

      console.log("\n📊 Hybrid Search Statistics:");
      console.log(`   Total Documents: ${retrieverStats.totalDocuments}`);
      console.log(`   Semantic Weight: ${retrieverStats.semanticWeight}`);
      console.log(`   Keyword Weight: ${retrieverStats.keywordWeight}`);
      console.log(`   Max Results: ${retrieverStats.maxResults}`);
      console.log(`   Final K: ${retrieverStats.finalK}`);
      console.log(`   Initialized: ${retrieverStats.isInitialized}`);

      console.log("\n💾 Conversation Memory Statistics:");
      console.log(`   Session ID: ${memoryStats.sessionId}`);
      console.log(`   Message Count: ${memoryStats.messageCount}`);
      console.log(`   Window Size: ${memoryStats.windowSize}`);
      console.log(`   Conversation ID: ${memoryStats.conversationId}`);
      console.log(`   Created: ${memoryStats.createdAt}`);
      console.log(`   Updated: ${memoryStats.updatedAt}`);
      continue;
    }

    // Handle clear command
    if (question.toLowerCase() === "clear") {
      await memory.clearHistory();
      console.log(
        "✅ Conversation history cleared. Starting fresh conversation.\n"
      );
      continue;
    }

    try {
      const startTime = Date.now();

      // Store user message in conversation history
      await memory.addMessage("user", question);

      // Update conversation title if this is the first user message
      const stats = await memory.getStats();
      if (stats.messageCount === 1) {
        await memory.updateTitle(question);
      }

      // Get token-aware context window (includes conversation + retrieved docs)
      const systemPrompt = `You are a helpful Shopify merchant support agent. Use the provided context to answer questions accurately and helpfully.`;

      console.log(
        "\n🔎 Performing hybrid search with token-aware context windowing..."
      );

      // First, get retrieved documents
      const conversationContext = await memory.getConversationContext();
      const contextualQuery = conversationContext
        ? `${conversationContext}Current question: ${question}`
        : question;
      const queryEmbedding = await embedSingle(contextualQuery);

      const results = await retriever.search({
        query: contextualQuery,
        queryEmbedding,
        k: 6, // Increased to get more comprehensive results
      });

      // Check for edge cases first
      const edgeCase = handleEdgeCases(results, question);
      if (edgeCase) {
        console.log("\n⚠️ Edge case detected - providing fallback response\n");
        const formattedResponse = formatResponse(
          edgeCase.answer,
          results,
          edgeCase.confidence
        );
        console.log(formattedResponse);
        console.log("\n" + "─".repeat(60));
        continue;
      }

      // Get token-aware context window
      const tokenAwareContext = await memory.getTokenAwareContext(
        results,
        systemPrompt
      );

      console.log(`📊 Token-aware context windowing applied:`);
      console.log(
        `   Messages: ${tokenAwareContext.tokenUsage.messageTokens} tokens`
      );
      console.log(
        `   Documents: ${tokenAwareContext.tokenUsage.documentTokens} tokens`
      );
      console.log(
        `   Total: ${tokenAwareContext.tokenUsage.totalTokens}/${memory.maxTokens} tokens`
      );

      if (tokenAwareContext.truncated) {
        console.log(
          `⚠️ Context truncated: ${tokenAwareContext.windowingStrategy.selectedMessageCount}/${tokenAwareContext.windowingStrategy.originalMessageCount} messages, ${tokenAwareContext.windowingStrategy.selectedDocCount}/${tokenAwareContext.windowingStrategy.originalDocCount} documents`
        );
      }

      const context = tokenAwareContext.documents
        .map(
          (r, i) =>
            `[Source ${i + 1}] ${r.metadata?.title || "Unknown"} (${
              r.metadata?.source_url || "N/A"
            })\n${r.doc}`
        )
        .join("\n\n---\n\n");

      console.log(
        `✓ Found ${tokenAwareContext.documents.length} relevant sections using token-aware hybrid search:`
      );

      // Show category diversity
      const categories = [
        ...new Set(
          tokenAwareContext.documents.map(
            (r) => r.metadata?.category || "unknown"
          )
        ),
      ];
      console.log(`📊 Categories represented: ${categories.join(", ")}`);

      tokenAwareContext.documents.forEach((result, i) => {
        console.log(
          `   ${i + 1}. ${
            result.metadata?.title || "Unknown"
          } (Score: ${result.score.toFixed(4)}, Type: ${
            result.searchType
          }, Category: ${result.metadata?.category || "unknown"})`
        );
      });
      console.log(
        "\n💭 Generating answer using retrieved context and conversation history...\n"
      );

      // Build conversation history from token-aware context
      const conversationHistory =
        tokenAwareContext.messages.length > 0
          ? tokenAwareContext.messages
              .map((msg) => `${msg.role}: ${msg.content}`)
              .join("\n")
          : "";

      const prompt = `You are a helpful Shopify Merchant Support Assistant.

Instructions:
- Answer the question using ONLY the provided documentation context below.
- Consider the conversation history to provide contextually relevant answers.
- Be clear, concise, and actionable.
- If the answer is not in the context, respond with: "I couldn't find this information in the available documentation."
- Format your response in a friendly, supportive tone.
- Reference previous conversation context when relevant to provide continuity.
- When providing information, cite the source using format: "According to [Source X]..." where X is the source number.
- Use markdown formatting for better readability (bold, lists, code blocks, etc.).

${conversationHistory ? `Conversation History:\n${conversationHistory}\n` : ""}

Retrieved Documentation:
${context}

Current User Question: ${question}

Answer:`;

      // Try generating content; if the model is unavailable, silently
      // fallback to gemini-1.5-flash and retry once.
      let result;
      try {
        result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        });
      } catch (err) {
        const msg = (err && err.message) || "";
        const unavailable =
          msg.includes("not available") ||
          msg.includes("404") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("model not found");

        if (unavailable && modelName !== "gemini-1.5-flash") {
          // Attempt silent fallback and retry once
          try {
            modelName = "gemini-1.5-flash";
            model = genAI.getGenerativeModel({ model: modelName });
            console.log(`Switched to fallback model: ${modelName}\n`);
            result = await model.generateContent({
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt }],
                },
              ],
            });
          } catch (err2) {
            // Give a safe fallback response instead of throwing an error
            result = { response: { text: () => "No response generated." } };
          }
        } else {
          // Non-model-availability error: return safe fallback
          result = { response: { text: () => "No response generated." } };
        }
      }

      const answer = result.response?.text() || "No response generated.";

      // Calculate confidence score
      const confidence = calculateConfidence(
        tokenAwareContext.documents,
        answer
      );

      // Format response with confidence and sources
      const formattedResponse = formatResponse(
        answer,
        tokenAwareContext.documents,
        confidence
      );

      // Store assistant's response in conversation history with token usage info
      await memory.addMessage("assistant", answer, {
        searchResults: tokenAwareContext.documents.map((r) => ({
          title: r.metadata?.title || "Unknown",
          source_url: r.metadata?.source_url || "N/A",
          category: r.metadata?.category || "unknown",
          score: r.score,
          searchType: r.searchType,
        })),
        modelUsed: modelName,
        processingTime: Date.now() - startTime,
        tokensUsed: tokenAwareContext.tokenUsage.totalTokens,
        confidence: confidence,
        tokenAwareContext: {
          truncated: tokenAwareContext.truncated,
          messageTokens: tokenAwareContext.tokenUsage.messageTokens,
          documentTokens: tokenAwareContext.tokenUsage.documentTokens,
          totalTokens: tokenAwareContext.tokenUsage.totalTokens,
          maxTokens: memory.maxTokens,
          windowingStrategy: tokenAwareContext.windowingStrategy,
        },
      });

      console.log("─".repeat(60));
      console.log("📝 Answer:\n");
      console.log(formattedResponse);
      console.log("\n" + "─".repeat(60));
    } catch (err) {
      console.error("\n❌ Error processing request:");

      if (err.message?.includes("404")) {
        console.error(`\nThe model "${modelName}" is not available.`);
        console.error("\n💡 Try these solutions:");
        console.error(
          "1. Use gemini-1.5-flash instead: Add to .env: GEMINI_MODEL=gemini-1.5-flash"
        );
        console.error(
          "2. Verify your API key is from Google AI Studio (not Vertex AI)"
        );
        console.error(
          "3. Get a new key: https://aistudio.google.com/app/apikey\n"
        );
      } else if (err.message?.includes("API key")) {
        console.error("\nAPI key issue detected.");
        console.error(
          "Get your key from: https://aistudio.google.com/app/apikey\n"
        );
      } else {
        console.error(`\n${err.message || err}\n`);
      }

      // Don't exit, let user try again
      continue;
    }
  }

  console.log("\n👋 Goodbye!\n");

  // Clean up MongoDB connection
  await disconnectDB();
}

main().catch(async (e) => {
  console.error("\n❌ Fatal error:", e.message || e);
  console.error(
    "\n💡 If you need help, check README.md for setup instructions.\n"
  );

  // Ensure MongoDB connection is closed on error
  await disconnectDB();
  process.exit(1);
});
