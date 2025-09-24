import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";

/**
 * Simple Chat Interface - Demonstrates RAG (Retrieval-Augmented Generation)
 * This combines vector search with LLM generation for intelligent responses
 */
export class Chat {
  constructor(vectorStore, apiKey) {
    this.vectorStore = vectorStore;

    // Initialize Gemini chat model
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      modelName: "gemini-1.5-flash", // Fast and efficient model
      temperature: 0.7, // Balance between creativity and consistency
    });

    // Create a prompt template for RAG
    this.promptTemplate = new PromptTemplate({
      template: `You are a helpful assistant that answers questions based on the provided context.

Context from documents:
{context}

Question: {question}

Instructions:
- Answer based ONLY on the provided context
- If the context doesn't contain enough information, say so
- Be concise and accurate
- Cite the source when possible

Answer:`,
      inputVariables: ["context", "question"],
    });
  }

  /**
   * Ask a question and get an answer using RAG
   * This demonstrates the complete RAG pipeline
   */
  async ask(question, maxResults = 3) {
    console.log("\n💬 CHAT WITH RAG");
    console.log("=".repeat(50));
    console.log(`❓ Question: ${question}`);

    try {
      // Step 1: Search for relevant documents
      console.log("🔍 Searching for relevant information...");
      const relevantDocs = await this.vectorStore.search(question, maxResults);

      if (relevantDocs.length === 0) {
        return "I couldn't find relevant information in the documents to answer your question.";
      }

      // Step 2: Prepare context from retrieved documents
      const context = relevantDocs
        .map(
          (doc, index) =>
            `Source ${index + 1} (${doc.metadata?.source || "Unknown"}):\n${
              doc.pageContent
            }`
        )
        .join("\n\n");

      console.log(`📚 Found ${relevantDocs.length} relevant document chunks`);
      console.log(`📝 Context length: ${context.length} characters`);

      // Step 3: Create the prompt with context and question
      const prompt = await this.promptTemplate.format({
        context: context,
        question: question,
      });

      // Step 4: Generate response using Gemini
      console.log("🤖 Generating response with Gemini...");
      const response = await this.llm.invoke(prompt);

      console.log("✅ Response generated successfully");
      return response.content;
    } catch (error) {
      console.error("❌ Error during chat:", error.message);
      return `Sorry, I encountered an error: ${error.message}`;
    }
  }

  /**
   * Demonstrate the RAG process step by step
   */
  async demonstrateRAG(question) {
    console.log("\n🔬 RAG DEMONSTRATION");
    console.log("=".repeat(50));
    console.log(`❓ Question: ${question}`);

    try {
      // Step 1: Show retrieval process
      console.log("\n1️⃣ RETRIEVAL PHASE");
      console.log("-".repeat(30));
      const relevantDocs = await this.vectorStore.searchWithScores(question, 3);

      console.log(`📚 Retrieved ${relevantDocs.length} relevant chunks:`);
      relevantDocs.forEach(([doc, score], index) => {
        console.log(
          `   ${index + 1}. Score: ${score.toFixed(4)} | Source: ${
            doc.metadata?.source || "Unknown"
          }`
        );
        console.log(`      Preview: ${doc.pageContent.substring(0, 80)}...`);
      });

      // Step 2: Show augmentation process
      console.log("\n2️⃣ AUGMENTATION PHASE");
      console.log("-".repeat(30));
      const context = relevantDocs
        .map(([doc, index]) => `[${index + 1}] ${doc.pageContent}`)
        .join("\n\n");

      console.log(`📝 Context prepared: ${context.length} characters`);
      console.log(
        `🔗 Context combines retrieved information with the question`
      );

      // Step 3: Show generation process
      console.log("\n3️⃣ GENERATION PHASE");
      console.log("-".repeat(30));
      const prompt = await this.promptTemplate.format({
        context: context,
        question: question,
      });

      console.log("🤖 Sending prompt to Gemini...");
      const response = await this.llm.invoke(prompt);

      console.log("\n✅ FINAL RESPONSE");
      console.log("-".repeat(30));
      console.log(response.content);

      return response.content;
    } catch (error) {
      console.error("❌ Error in RAG demonstration:", error.message);
      return `Error: ${error.message}`;
    }
  }

  /**
   * Simple chat without RAG (just using the LLM)
   */
  async simpleChat(message) {
    console.log("\n💬 SIMPLE CHAT (No RAG)");
    console.log("=".repeat(50));
    console.log(`❓ Message: ${message}`);

    try {
      const response = await this.llm.invoke(message);
      console.log("✅ Response generated");
      return response.content;
    } catch (error) {
      console.error("❌ Error in simple chat:", error.message);
      return `Error: ${error.message}`;
    }
  }

  /**
   * Compare RAG vs non-RAG responses
   */
  async compareRAGvsSimple(question) {
    console.log("\n⚖️ RAG vs SIMPLE CHAT COMPARISON");
    console.log("=".repeat(50));
    console.log(`❓ Question: ${question}`);

    console.log("\n🔍 RAG Response (with document context):");
    console.log("-".repeat(40));
    const ragResponse = await this.ask(question);
    console.log(ragResponse);

    console.log("\n🤖 Simple Chat Response (no context):");
    console.log("-".repeat(40));
    const simpleResponse = await this.simpleChat(question);
    console.log(simpleResponse);

    return {
      rag: ragResponse,
      simple: simpleResponse,
    };
  }
}
