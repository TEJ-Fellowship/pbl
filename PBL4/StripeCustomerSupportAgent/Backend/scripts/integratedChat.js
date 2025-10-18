import readline from "readline";
import fs from "fs/promises";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import HybridSearch from "../hybridSearch.js";
import PostgreSQLBM25Service from "../services/postgresBM25Service.js";
import MemoryController from "../controllers/memoryController.js";
import MCPIntegrationService from "../services/mcpIntegrationService.js";
import QueryClassifier from "../services/queryClassifier.js";
import config from "../config/config.js";

// Initialize Gemini client
function initGeminiClient() {
  if (!config.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenerativeAI(config.GEMINI_API_KEY);
}

// Initialize Gemini embeddings
function initGeminiEmbeddings() {
  if (!config.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey: config.GEMINI_API_KEY,
    modelName: "text-embedding-004",
  });
}

// Initialize Pinecone client
async function initPinecone() {
  try {
    if (!config.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY environment variable is required");
    }

    const pinecone = new Pinecone({ apiKey: config.PINECONE_API_KEY });
    console.log("✅ Pinecone client initialized");
    return pinecone;
  } catch (error) {
    console.error("❌ Pinecone initialization failed:", error.message);
    throw error;
  }
}

// Load vector store from Pinecone
async function loadVectorStore() {
  try {
    const pinecone = await initPinecone();
    const index = pinecone.index(config.PINECONE_INDEX_NAME);
    console.log("✅ Vector store loaded from Pinecone");
    return { type: "pinecone", index };
  } catch (error) {
    console.error("❌ Failed to load vector store:", error.message);
    throw error;
  }
}

// Calculate cosine similarity
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Retrieve relevant chunks using hybrid search
async function retrieveChunksWithHybridSearch(
  query,
  vectorStore,
  embeddings,
  hybridSearch
) {
  try {
    console.log(
      "\n🔍 Searching for relevant information using hybrid search..."
    );

    // Ensure hybrid search is initialized
    if (!hybridSearch.isInitialized) {
      console.log("🔧 Initializing hybrid search...");
      await hybridSearch.initialize();
    }

    // Perform hybrid search
    const results = await hybridSearch.hybridSearch(
      query,
      parseInt(config.MAX_CHUNKS) || 10
    );

    if (!results || results.length === 0) {
      console.log(
        "❌ No results from hybrid search, falling back to semantic search"
      );
      return retrieveChunksWithEmbeddings(query, vectorStore, embeddings);
    }

    // Format results for consistency
    const topChunks = results.map((result) => ({
      content: result.content,
      metadata: result.metadata,
      similarity: result.finalScore || result.score || 0,
      score: result.finalScore || result.score || 0,
      searchType: result.searchType || "hybrid",
      bm25Score: result.bm25Score,
      semanticScore: result.semanticScore,
    }));

    console.log(
      `📊 Top hybrid scores: ${topChunks
        .slice(0, 3)
        .map((t) => t.similarity.toFixed(3))
        .join(", ")}`
    );

    console.log(
      `📚 Found ${topChunks.length} relevant chunks using hybrid search`
    );
    return topChunks;
  } catch (error) {
    console.error(
      "❌ Hybrid search failed, falling back to semantic search:",
      error.message
    );
    return retrieveChunksWithEmbeddings(query, vectorStore, embeddings);
  }
}

// Retrieve relevant chunks using embeddings (fallback)
async function retrieveChunksWithEmbeddings(query, vectorStore, embeddings) {
  try {
    console.log(
      "🔍 Searching for relevant information using Gemini embeddings..."
    );

    // Generate query embedding using LangChain Gemini embeddings
    const queryEmbedding = await embeddings.embedQuery(query);

    // Debug: Check if embedding was generated
    if (
      !queryEmbedding ||
      !Array.isArray(queryEmbedding) ||
      queryEmbedding.length === 0
    ) {
      throw new Error("Failed to generate query embedding");
    }

    console.log(
      `📊 Query embedding generated with ${queryEmbedding.length} dimensions`
    );

    let topChunks = [];

    if (vectorStore.type === "pinecone") {
      console.log("🔍 Searching in Pinecone...");
      const searchResponse = await vectorStore.index.query({
        vector: queryEmbedding,
        topK: parseInt(config.MAX_CHUNKS) || 10,
        includeMetadata: true,
      });

      topChunks = searchResponse.matches.map((match) => ({
        content: match.metadata.content,
        metadata: {
          source: match.metadata.source,
          title: match.metadata.title,
          category: match.metadata.category,
          docType: match.metadata.docType,
          chunk_index: match.metadata.chunk_index,
          total_chunks: match.metadata.total_chunks,
        },
        similarity: match.score,
      }));
    } else {
      console.log("🔍 Searching in local vector store...");
      const similarities = vectorStore.data.chunks.map((chunk) => {
        if (!chunk.embedding || !Array.isArray(chunk.embedding)) {
          return { chunk, similarity: 0 };
        }
        return {
          chunk,
          similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
        };
      });

      topChunks = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, parseInt(config.MAX_CHUNKS) || 10)
        .map((item) => ({
          content: item.chunk.content,
          metadata: item.chunk.metadata,
          similarity: item.similarity,
        }));
    }

    console.log(
      `📊 Top similarity scores: ${topChunks
        .slice(0, 3)
        .map((t) => t.similarity.toFixed(3))
        .join(", ")}`
    );

    console.log(
      `📚 Found ${topChunks.length} relevant chunks using semantic search`
    );
    return topChunks;
  } catch (error) {
    console.error("❌ Embedding retrieval failed:", error.message);
    console.log("   Please check your Pinecone configuration and try again.");
    throw error;
  }
}

// Calculate confidence score from search results (new)
function calculateConfidence(chunks) {
  if (chunks.length === 0) return 0;

  // Calculate average similarity score
  const avgScore =
    chunks.reduce((sum, chunk) => sum + (chunk.similarity || 0), 0) /
    chunks.length;

  // Normalize to 0-1 range
  return Math.min(1, Math.max(0, avgScore));
}

// Generate response using Gemini with MCP integration
async function generateResponseWithMCP(
  query,
  chunks,
  geminiClient,
  mcpService,
  confidence,
  precomputedMcpEnhancement = null,
  precomputedMcpToolsUsed = null,
  precomputedMcpConfidence = null
) {
  try {
    console.log("\n🤖 Generating response with MCP integration...");

    // Process query with MCP tools (use pre-computed results if available)
    let mcpResult = null;
    let mcpToolsUsed = [];
    let mcpConfidence = 0;

    if (precomputedMcpEnhancement !== null) {
      // Use pre-computed MCP results
      mcpResult = {
        success: true,
        enhancedResponse: precomputedMcpEnhancement,
        toolsUsed: precomputedMcpToolsUsed || [],
        confidence: precomputedMcpConfidence || 0,
      };
      mcpToolsUsed = precomputedMcpToolsUsed || [];
      mcpConfidence = precomputedMcpConfidence || 0;
      console.log("🔧 Using pre-computed MCP results...");
      console.log(`✅ MCP tools used: ${mcpToolsUsed.join(", ")}`);
      console.log(`📊 MCP confidence: ${(mcpConfidence * 100).toFixed(1)}%`);
    } else {
      // Process MCP tools if not pre-computed
      try {
        console.log("🔧 Processing with MCP tools...");
        mcpResult = await mcpService.processQueryWithMCP(query, confidence);

        if (mcpResult.success && mcpResult.enhancedResponse) {
          mcpToolsUsed = mcpResult.toolsUsed || [];
          mcpConfidence = mcpResult.confidence || 0;

          console.log(`✅ MCP tools used: ${mcpToolsUsed.join(", ")}`);
          console.log(
            `📊 MCP confidence: ${(mcpConfidence * 100).toFixed(1)}%`
          );
        } else {
          console.log("ℹ️ No MCP tools needed for this query");
        }
      } catch (error) {
        console.warn("⚠️ MCP processing failed:", error.message);
        console.log("   Continuing with standard response generation...");
      }
    }

    // Use MCP tool results only with simple prompt
    let prompt = `You are a helpful assistant. Answer the user's question based on the provided information.

        USER QUESTION: ${query}

        INFORMATION:
        ${
          mcpResult && mcpResult.enhancedResponse
            ? mcpResult.enhancedResponse
            : "No specific information available."
        }

        Please provide a simple, direct answer to the user's question.`;

    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      answer: text,
      sources: [],
      mcpEnhancement: mcpResult?.enhancedResponse || "",
      mcpToolsUsed: mcpToolsUsed,
      mcpConfidence: mcpConfidence,
      overallConfidence: mcpConfidence,
    };
  } catch (error) {
    console.error("❌ Response generation failed:", error.message);
    throw error;
  }
}

// Generate response with memory context integration and MCP(upgraded)
async function generateResponseWithMemoryAndMCP(
  query,
  chunks,
  geminiClient,
  memoryContext,
  mcpService,
  confidence,
  precomputedMcpEnhancement = null,
  precomputedMcpToolsUsed = null,
  precomputedMcpConfidence = null
) {
  try {
    console.log(
      "\n🤖 Generating response with memory context and MCP integration..."
    );

    // Prepare context from retrieved chunks
    const context = chunks
      .map((chunk, index) => `[Source ${index + 1}] ${chunk.content}`)
      .join("\n\n");

    const sources = chunks.map((chunk, index) => ({
      content: chunk.content,
      metadata: chunk.metadata,
      similarity: chunk.similarity,
      score: chunk.score || 0,
      index: index + 1,
    }));

    // Build memory context string
    let memoryContextString = "";

    if (memoryContext.recentContext && memoryContext.recentContext.hasContext) {
      memoryContextString += `\n\nRECENT CONVERSATION CONTEXT:\n${memoryContext.recentContext.contextString}`;
    }

    if (
      memoryContext.longTermContext &&
      memoryContext.longTermContext.hasContext
    ) {
      memoryContextString += `\n\nRELEVANT HISTORICAL CONTEXT:\n${memoryContext.longTermContext.contextString}`;
    }

    // Process query with MCP tools (use pre-computed results if available)
    let mcpEnhancement = "";
    let mcpToolsUsed = [];
    let mcpConfidence = 0;

    if (precomputedMcpEnhancement !== null) {
      // Use pre-computed MCP results
      mcpEnhancement = precomputedMcpEnhancement;
      mcpToolsUsed = precomputedMcpToolsUsed || [];
      mcpConfidence = precomputedMcpConfidence || 0;
      console.log("🔧 Using pre-computed MCP results...");
      console.log(`✅ MCP tools used: ${mcpToolsUsed.join(", ")}`);
      console.log(`📊 MCP confidence: ${(mcpConfidence * 100).toFixed(1)}%`);
    } else {
      // Process MCP tools if not pre-computed
      try {
        console.log("🔧 Processing with MCP tools...");
        const mcpResult = await mcpService.processQueryWithMCP(
          query,
          confidence
        );

        if (mcpResult.success && mcpResult.enhancedResponse) {
          mcpEnhancement = mcpResult.enhancedResponse;
          mcpToolsUsed = mcpResult.toolsUsed || [];
          mcpConfidence = mcpResult.confidence || 0;

          console.log(`✅ MCP tools used: ${mcpToolsUsed.join(", ")}`);
          console.log(
            `📊 MCP confidence: ${(mcpConfidence * 100).toFixed(1)}%`
          );
        } else {
          console.log("ℹ️ No MCP tools needed for this query");
        }
      } catch (error) {
        console.warn("⚠️ MCP processing failed:", error.message);
        console.log("   Continuing with standard response generation...");
      }
    }

    // Build enhanced prompt with memory and MCP integration
    let prompt = `You are an expert Stripe API support assistant with deep knowledge of Stripe's payment processing, webhooks, and developer tools. Your role is to provide accurate, helpful, and actionable guidance to developers working with Stripe.

    CONTEXT (Stripe Documentation):
    ${context}${memoryContextString}

    USER QUESTION: ${query}

    RESPONSE GUIDELINES:
    1. **Accuracy First**: Base your answer strictly on the provided Stripe documentation context
    2. **Be Specific**: Provide exact API endpoints, parameter names, and code examples when relevant
    3. **Include Code**: Always include practical code examples in the appropriate programming language
    4. **Step-by-Step**: Break down complex processes into clear, actionable steps
    5. **Error Handling**: Mention common errors and how to handle them
    6. **Best Practices**: Include security considerations and best practices
    7. **Source Citations**: Reference specific sources using [Source X] format
    8. **Memory Integration**: Use conversation context to provide personalized responses
    9. **If Uncertain**: Clearly state when information isn't available in the context

    FORMAT YOUR RESPONSE:
    - Start with a direct answer to the question
    - Provide detailed explanation with code examples
    - Include relevant API endpoints and parameters
    - Mention any prerequisites or setup requirements
    - End with source citations`;

    // Add MCP enhancement if available
    if (mcpEnhancement) {
      prompt += `\n\nADDITIONAL INTELLIGENCE (MCP Tools):
        ${mcpEnhancement}

        INTEGRATION NOTES:
        - Use the MCP tool results to enhance your response
        - If MCP tools provided calculations, status checks, or validations, incorporate them
        - Maintain the same response format while integrating MCP insights
        - If MCP tools found conflicting information, prioritize the documentation context`;
    }

    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      answer: text,
      sources: sources,
      mcpEnhancement: mcpEnhancement,
      mcpToolsUsed: mcpToolsUsed,
      mcpConfidence: mcpConfidence,
      overallConfidence: Math.max(confidence, mcpConfidence),
    };
  } catch (error) {
    console.error("❌ Response generation failed:", error.message);
    throw error;
  }
}

// Main chat function with MCP integration
async function startIntegratedChat() {
  try {
    console.log("🚀 Starting Integrated Stripe Support Chat with MCP Tools");
    console.log("=".repeat(60));

    // Initialize services
    console.log("🔧 Initializing services...");
    const geminiClient = initGeminiClient();
    const embeddings = initGeminiEmbeddings();
    const vectorStore = await loadVectorStore();
    const memoryController = new MemoryController();
    const mcpService = new MCPIntegrationService();
    const queryClassifier = new QueryClassifier(mcpService.orchestrator);

    // Initialize PostgreSQL BM25 service for hybrid search
    const postgresBM25Service = new PostgreSQLBM25Service();
    const hybridSearch = new HybridSearch(
      vectorStore,
      embeddings,
      postgresBM25Service
    );

    // Initialize memory session
    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    await memoryController.initializeSession(
      sessionId,
      "integrated_chat_user",
      {
        project: "stripe_support",
        context: "customer_support_with_mcp",
        startTime: new Date().toISOString(),
      }
    );

    // Wait for MCP service to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Initialize hybrid search
    console.log("🔧 Initializing hybrid search...");
    await hybridSearch.initialize();

    console.log("✅ All services initialized successfully");

    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = () => {
      console.log(
        "\nType 'exit' to quit, 'mcp' to check MCP system status, 'classifier' to check query classifier status, 'sample' for more questions"
      );
      console.log("=".repeat(60));
      rl.question("\n❓ Your question: ", async (query) => {
        if (query.toLowerCase() === "exit") {
          console.log("👋 Goodbye!");

          // Create conversation summary before closing
          try {
            await memoryController.createConversationSummary();
            console.log("📝 Conversation summary created and stored");
          } catch (error) {
            console.error(
              "❌ Failed to create conversation summary:",
              error.message
            );
          }

          // Close memory system
          await memoryController.close();
          rl.close();
          return;
        }

        if (query.toLowerCase() === "mcp") {
          console.log("\n🔧 MCP System Status:");
          try {
            const mcpStatus = mcpService.getToolManagementInfo();

            // Check integration status with null safety
            const integrationStatus = mcpStatus.integrationEnabled
              ? "✅ Enabled"
              : "❌ Disabled";
            console.log(`   Integration: ${integrationStatus}`);

            // Check tools status with null safety
            console.log(
              `   Tools Available: ${
                mcpStatus.availableTools?.length || mcpStatus.status?.total || 0
              }`
            );
            console.log(`   Tools Enabled: ${mcpStatus.status?.enabled || 0}`);
            console.log(
              `   Tools Disabled: ${mcpStatus.status?.disabled || 0}`
            );

            // Show tool details if available
            if (mcpStatus.status?.details) {
              console.log("\n🛠️ Tool Details:");
              Object.entries(mcpStatus.status.details).forEach(
                ([toolName, details]) => {
                  const status = details.enabled ? "✅" : "❌";
                  console.log(
                    `   ${status} ${toolName}: ${details.description}`
                  );
                }
              );
            } else {
              console.log("\n🛠️ Tool Details: Not available");
            }

            // Show orchestrator tools (all available tools)
            if (
              mcpStatus.orchestratorTools &&
              Object.keys(mcpStatus.orchestratorTools).length > 0
            ) {
              console.log("\n🔧 Orchestrator Tools:");
              Object.entries(mcpStatus.orchestratorTools).forEach(
                ([toolName, toolInfo]) => {
                  console.log(
                    `   ✅ ${toolName}: ${
                      toolInfo.description || toolInfo.name
                    }`
                  );
                }
              );
            }

            // Show AI selection status if available
            if (mcpStatus.aiSelection && mcpStatus.aiSelection.available) {
              console.log("\n🤖 AI Selection:");
              console.log(
                `   Status: ${
                  mcpStatus.aiSelection.available
                    ? "✅ Available"
                    : "❌ Unavailable"
                }`
              );
              console.log(
                `   AI Decisions: ${mcpStatus.aiSelection.aiDecisions || 0}`
              );
              console.log(
                `   Fallback Decisions: ${
                  mcpStatus.aiSelection.fallbackDecisions || 0
                }`
              );
            } else {
              console.log("\n🤖 AI Selection: Not available");
            }
          } catch (error) {
            console.log("   ❌ Error getting MCP status:", error.message);
            console.log("   ℹ️ MCP system may not be fully initialized");
          }

          askQuestion();
          return;
        }

        if (query.toLowerCase() === "classifier") {
          console.log("\n🤖 Query Classifier Status:");
          try {
            const classifierStats = queryClassifier.getStats();
            console.log(
              `   Gemini AI: ${
                classifierStats.geminiAvailable
                  ? "✅ Available"
                  : "❌ Unavailable"
              }`
            );
            console.log(`   Model: ${classifierStats.model}`);

            console.log("\n📊 Classification Approaches:");
            console.log(
              "   • MCP_TOOLS_ONLY - Direct tool responses (calculations, status checks)"
            );
            console.log(
              "   • HYBRID_SEARCH - Documentation-based responses (API guides, tutorials)"
            );
            console.log(
              "   • COMBINED - Both tools and documentation (complex queries)"
            );
          } catch (error) {
            console.log(
              "   ❌ Error getting classifier status:",
              error.message
            );
          }

          askQuestion();
          return;
        }

        if (query.toLowerCase() === "sample") {
          console.log("\n💡 Example Questions by Classification:");
          console.log("\n🔧 MCP_TOOLS_ONLY Examples:");
          console.log("  • What's Stripe's fee for $1000? (Calculator Tool)");
          console.log("  • Is Stripe down right now? (Status Checker Tool)");
          console.log("  • What time is it now? (DateTime Tool)");
          console.log(
            "  • Search for latest Stripe API updates (Web Search Tool)"
          );
          console.log(
            "  • Validate this endpoint: /v1/charges (Code Validator Tool)"
          );
          console.log(
            "  • Convert $50 USD to Nepali rupee (Currency Converter Tool)"
          );

          console.log("\n📚 HYBRID_SEARCH Examples:");
          console.log("  • How do I create a payment intent with Stripe?");
          console.log("  • How to handle Stripe API errors and exceptions?");
          console.log(
            "  • What are webhook signatures and how do I verify them?"
          );
          console.log("  • How do I set up subscription billing with Stripe?");
          console.log("  • How to handle refunds and disputes?");
          console.log("  • How to implement multi-party payments?");

          console.log("\n🔧📚 COMBINED Examples:");
          console.log(
            "  • Calculate Stripe fees for $500 and show me the API implementation"
          );
          console.log("  • Is Stripe working and how do I implement webhooks?");
          console.log(
            "  • What's the current status and how do I handle disputes?"
          );
          console.log("  • Calculate fees and show me how to set up billing");

          console.log("\n💡 Commands:");
          console.log("  • Type 'mcp' to check MCP system status");
          console.log("  • Type 'classifier' to check query classifier status");
          console.log("  • Type 'exit' to quit");

          askQuestion();
          return;
        }

        if (query.trim() === "") {
          console.log("❌ Please enter a question.");
          askQuestion();
          return;
        }

        try {
          // Process user message with memory system
          await memoryController.processUserMessage(query, {
            timestamp: new Date().toISOString(),
            source: "integrated_chat_interface",
          });

          // Step 1: Classify the original query to decide approach
          const enabledTools = mcpService.getEnabledTools();
          const classification = await queryClassifier.classifyQuery(
            query,
            0.5,
            enabledTools
          );
          console.log(
            `📊 Classification: ${classification.approach} - ${classification.reasoning}`
          );

          let result;
          let chunks = [];
          let searchQuery = query; // Initialize searchQuery with original query

          // Step 2: Route based on classification
          if (classification.approach === "MCP_TOOLS_ONLY") {
            console.log("\n");
            console.log("-".repeat(60));
            console.log("🔧 Using MCP tools only approach");

            // Try MCP tools first
            const mcpResult = await mcpService.processQueryWithMCP(query, 0.5);

            if (mcpResult.success && mcpResult.enhancedResponse) {
              // Generate response using MCP tools only (pass pre-computed results)
              result = await generateResponseWithMCP(
                query,
                [], // No chunks needed for MCP-only
                geminiClient,
                mcpService,
                0.8, // High confidence for MCP tools
                mcpResult.enhancedResponse,
                mcpResult.toolsUsed || [],
                mcpResult.confidence || 0
              );
            } else {
              // Fallback to hybrid search if MCP fails
              console.log("⚠️ MCP tools failed, falling back to hybrid search");

              // Get complete memory context for query reformulation
              const memoryContext =
                await memoryController.getCompleteMemoryContext(query);
              console.log(
                `🧠 Memory context: ${
                  memoryContext.recentContext?.messageCount || 0
                } recent messages, ${
                  memoryContext.longTermContext?.relevantQAs?.length || 0
                } relevant Q&As`
              );

              // Use reformulated query for retrieval
              searchQuery = memoryContext.reformulatedQuery || query;
              console.log(
                `\n🔍 Searching with reformulated query: "${searchQuery.substring(
                  0,
                  60
                )}..."`
              );

              chunks = await retrieveChunksWithHybridSearch(
                searchQuery,
                vectorStore,
                embeddings,
                hybridSearch
              );

              if (chunks.length === 0) {
                console.log(
                  "❌ No relevant information found. Try rephrasing your question."
                );
                askQuestion();
                return;
              }

              const confidence = calculateConfidence(chunks);
              result = await generateResponseWithMemoryAndMCP(
                query,
                chunks,
                geminiClient,
                memoryContext,
                mcpService,
                confidence
              );
            }
          } else if (classification.approach === "HYBRID_SEARCH") {
            console.log("🔍 Using hybrid search only approach");

            // Get complete memory context for query reformulation
            const memoryContext =
              await memoryController.getCompleteMemoryContext(query);
            console.log(
              `🧠 Memory context: ${
                memoryContext.recentContext?.messageCount || 0
              } recent messages, ${
                memoryContext.longTermContext?.relevantQAs?.length || 0
              } relevant Q&As`
            );

            // Use reformulated query for retrieval (for hybridSearch)
            searchQuery = memoryContext.reformulatedQuery || query;
            console.log(
              `\n🔍 Searching with reformulated query: "${searchQuery.substring(
                0,
                60
              )}..."`
            );
            // Retrieve relevant chunks using hybrid search
            chunks = await retrieveChunksWithHybridSearch(
              searchQuery,
              vectorStore,
              embeddings,
              hybridSearch
            );

            if (chunks.length === 0) {
              console.log(
                "❌ No relevant information found. Try rephrasing your question."
              );
              askQuestion();
              return;
            }

            // Calculate confidence score
            const confidence = calculateConfidence(chunks);
            console.log(
              `📊 Document confidence: ${(confidence * 100).toFixed(1)}%`
            );

            // Generate response with memory context (mcp enhanced)
            result = await generateResponseWithMemoryAndMCP(
              query,
              chunks,
              geminiClient,
              memoryContext,
              mcpService,
              confidence
            );
          } else if (classification.approach === "COMBINED") {
            console.log("\n🔧🔍 Using combined approach (MCP + Hybrid search)");
            console.log("-".repeat(40));

            // Get complete memory context for query reformulation
            const memoryContext =
              await memoryController.getCompleteMemoryContext(query);
            console.log(
              `🧠 Memory context: ${
                memoryContext.recentContext?.messageCount || 0
              } recent messages, ${
                memoryContext.longTermContext?.relevantQAs?.length || 0
              } relevant Q&As`
            );
            console.log("-".repeat(40));
            // Use reformulated query for retrieval (for MCP and hybrid search)
            searchQuery = memoryContext.reformulatedQuery || query;
            console.log("\n");
            console.log("-".repeat(40));
            console.log(
              `🔍 Searching with reformulated query (MCP and hybrid search): "${searchQuery.substring(
                0,
                30
              )}..."`
            );

            // Get both MCP and hybrid search results
            const [mcpResult, hybridResult] = await Promise.allSettled([
              mcpService.processQueryWithMCP(query, 0.5), // Use original query for MCP
              retrieveChunksWithHybridSearch(
                searchQuery, // Use reformulated query for hybrid search
                vectorStore,
                embeddings,
                hybridSearch
              ),
            ]);

            // Extract MCP results if successful
            let mcpEnhancement = "";
            let mcpToolsUsed = [];
            let mcpConfidence = 0;

            if (mcpResult.status === "fulfilled" && mcpResult.value.success) {
              mcpEnhancement = mcpResult.value.enhancedResponse || "";
              mcpToolsUsed = mcpResult.value.toolsUsed || [];
              mcpConfidence = mcpResult.value.confidence || 0;
              console.log(`✅ MCP tools used: ${mcpToolsUsed.join(", ")}`);
              console.log(
                `📊 MCP confidence: ${(mcpConfidence * 100).toFixed(1)}%`
              );
            }

            // Use hybrid search results if available
            if (
              hybridResult.status === "fulfilled" &&
              hybridResult.value.length > 0
            ) {
              chunks = hybridResult.value;
            }

            if (chunks.length === 0) {
              console.log(
                "❌ No relevant information found. Try rephrasing your question."
              );
              askQuestion();
              return;
            }

            // Calculate confidence score
            const confidence = calculateConfidence(chunks);
            console.log(
              `📊 Document confidence: ${(confidence * 100).toFixed(1)}%`
            );

            // Generate response with both MCP and hybrid search
            result = await generateResponseWithMemoryAndMCP(
              query,
              chunks,
              geminiClient,
              memoryContext,
              mcpService,
              confidence,
              mcpEnhancement,
              mcpToolsUsed,
              mcpConfidence
            );
          } else {
            throw new Error(
              `Unknown classification approach: ${classification.approach}`
            );
          }

          //step 3: Process assistant response with memory system
          await memoryController.processAssistantResponse(result.answer, {
            timestamp: new Date().toISOString(),
            sources: result.sources?.length || 0,
            searchQuery:
              classification.approach === "MCP_TOOLS_ONLY"
                ? query
                : searchQuery || query,
            mcpToolsUsed: result.mcpToolsUsed?.length || 0,
            mcpConfidence: result.mcpConfidence || 0,
          });

          console.log("\n🤖 Assistant:");
          console.log("-".repeat(40));
          console.log(result.answer);
          console.log("-".repeat(40));

          // Show MCP tool usage if applicable
          if (result.mcpToolsUsed && result.mcpToolsUsed.length > 0) {
            console.log(
              `\n🔧 MCP Tools Used: ${result.mcpToolsUsed.join(", ")}`
            );
            console.log(
              `📊 MCP Confidence: ${(result.mcpConfidence * 100).toFixed(1)}%`
            );
            console.log(
              `📊 Overall Confidence: ${(
                result.overallConfidence * 100
              ).toFixed(1)}%`
            );
          }

          // Show sources only if not MCP-only response
          if (result.sources && result.sources.length > 0) {
            console.log("\n📚 Sources:");
            result.sources.forEach((source) => {
              // Generate a better title from content if metadata title is empty
              let title = source.metadata.title || source.metadata.doc_title;
              if (!title || title.trim() === "") {
                // Extract first meaningful line from content as title
                const contentLines = source.content
                  .split("\n")
                  .filter((line) => line.trim() !== "");
                const firstLine = contentLines[0] || "";
                title =
                  firstLine.length > 60
                    ? firstLine.substring(0, 60) + "..."
                    : firstLine;
                if (!title) title = "Stripe Documentation";
              }

              const category = source.metadata.category || "documentation";
              const url =
                source.metadata.source ||
                source.metadata.source_url ||
                "https://stripe.com/docs";

              console.log(`${source.index}. ${title} (${category})`);
              console.log(`   URL: ${url}`);
              const relevanceScore = source.similarity || source.score || 0;
              let relevanceType = "similarity";
              let relevanceDetails = "";

              if (source.searchType === "hybrid") {
                relevanceType = "hybrid";
                const bm25Score = source.bm25Score || 0;
                const semanticScore = source.semanticScore || 0;
                relevanceDetails = ` (BM25: ${bm25Score.toFixed(
                  3
                )}, Semantic: ${semanticScore.toFixed(3)})`;
              } else if (source.similarity) {
                relevanceType = "semantic";
              } else {
                relevanceType = "keywords matched";
              }

              console.log(
                `   Relevance: ${relevanceScore.toFixed(
                  3
                )} ${relevanceType}${relevanceDetails}`
              );
            });
          }
        } catch (error) {
          console.error("❌ Error processing question:", error.message);
        }

        askQuestion();
      });
    };

    askQuestion();
  } catch (error) {
    console.error("❌ Integrated chat initialization failed:", error.message);
    process.exit(1);
  }
}

// Handle CLI execution
if (process.argv[1] && process.argv[1].endsWith("integratedChat.js")) {
  startIntegratedChat().catch(console.error);
}

export {
  generateResponseWithMCP,
  generateResponseWithMemoryAndMCP,
  loadVectorStore,
  initGeminiClient,
  initGeminiEmbeddings,
  retrieveChunksWithHybridSearch,
  calculateConfidence,
};
