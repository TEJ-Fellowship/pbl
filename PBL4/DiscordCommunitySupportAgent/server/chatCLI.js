import { searchSimilarDocuments } from "./chroma/chromaClient.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import chalk from "chalk";
import readline from "readline";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Gemini AI for answer generation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function displayWelcome() {
  console.clear();
  console.log(chalk.blue.bold("🎮 Discord Community Support Agent"));
  console.log(chalk.gray("=" .repeat(50)));
  console.log(chalk.yellow("Ask questions about Discord server management, permissions, and bots!"));
  console.log(chalk.gray("Type 'exit' or 'quit' to leave\n"));
}

async function generateAnswer(query, retrievedDocs) {
  try {
    // Prepare context from retrieved documents
    const context = retrievedDocs.map((doc, index) => 
      `Source ${index + 1} (${doc.metadata.source}):\n${doc.content}\n`
    ).join('\n');

    // Create a prompt for Gemini to generate a comprehensive answer
    const prompt = `You are a Discord Community Support Agent. Based on the following context from Discord documentation, provide a helpful, accurate, and comprehensive answer to the user's question.

User Question: ${query}

Context from Discord Documentation:
${context}

Instructions:
1. Provide a clear, helpful answer based on the context above
2. If the context doesn't contain enough information, say so politely
3. Use Discord-specific terminology correctly
4. Be concise but thorough
5. If there are step-by-step instructions, present them clearly
6. Use Discord emojis appropriately (⚙️, 🔒, ➕, etc.)

Answer:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Error generating answer:", error.message);
    return "I apologize, but I'm having trouble generating an answer right now. Please try again.";
  }
}

async function displayAnswer(query, results) {
  console.log(chalk.green.bold("\n🔍 Query: ") + chalk.white(query));
  console.log(chalk.gray("-".repeat(50)));
  
  if (!results.documents || results.documents.length === 0) {
    console.log(chalk.red("❌ No relevant information found."));
    return;
  }

  // Prepare retrieved documents for AI generation
  const retrievedDocs = results.documents[0].map((doc, index) => ({
    content: doc,
    metadata: results.metadatas[0][index],
    similarity: 1 - results.distances[0][index]
  }));

  console.log(chalk.yellow("🤖 Generating AI answer..."));
  
  // Generate AI answer using Gemini
  const aiAnswer = await generateAnswer(query, retrievedDocs);
  
  console.log(chalk.blue.bold("\n💬 AI Answer:"));
  console.log(chalk.white(aiAnswer));
  
  // Show sources for reference
  console.log(chalk.gray("\n📚 Sources:"));
  retrievedDocs.forEach((doc, index) => {
    console.log(chalk.gray(`  ${index + 1}. ${doc.metadata.source} (Chunk ${doc.metadata.chunkIndex}) - Similarity: ${doc.similarity.toFixed(3)}`));
  });
}

async function askQuestion(query) {
  try {
    console.log(chalk.yellow("🔮 Searching knowledge base..."));
    
    // Search for similar documents
    const results = await searchSimilarDocuments(query, 5); // Get more docs for better context
    
    await displayAnswer(query, results);
    
  } catch (error) {
    console.error(chalk.red("❌ Error searching knowledge base:"), error.message);
  }
}

function promptUser() {
  rl.question(chalk.cyan("\n❓ Ask a question: "), async (input) => {
    const query = input.trim();
    
    if (query.toLowerCase() === 'exit' || query.toLowerCase() === 'quit') {
      console.log(chalk.green("👋 Thanks for using Discord Community Support Agent!"));
      rl.close();
      return;
    }
    
    if (query === '') {
      console.log(chalk.red("Please enter a question."));
      promptUser();
      return;
    }
    
    await askQuestion(query);
    promptUser();
  });
}

async function startChat() {
  try {
    displayWelcome();
    
    // Test if Chroma database is accessible
    console.log(chalk.yellow("🔍 Testing database connection..."));
    await searchSimilarDocuments("test", 1);
    console.log(chalk.green("✅ Database connection successful!"));
    
    // Test Gemini AI
    console.log(chalk.yellow("🤖 Testing AI generation..."));
    const testResult = await model.generateContent("Hello, are you working?");
    const testResponse = await testResult.response;
    console.log(chalk.green("✅ AI generation successful!\n"));
    
    promptUser();
    
  } catch (error) {
    console.error(chalk.red("❌ Error starting chat:"), error.message);
    console.log(chalk.yellow("Make sure you've run 'node processDocsGemini.js' first to set up the database."));
    rl.close();
  }
}

// Start the chat interface
startChat();