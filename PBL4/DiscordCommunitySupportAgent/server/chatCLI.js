import { searchSimilarDocuments } from "./chroma/chromaClient.js";
import { embedQuery } from "./utils/embeddings.js";
import chalk from "chalk";
import readline from "readline";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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

function displayAnswer(query, results) {
  console.log(chalk.green.bold("\n🔍 Query: ") + chalk.white(query));
  console.log(chalk.gray("-".repeat(50)));
  
  if (!results.documents || results.documents.length === 0) {
    console.log(chalk.red("❌ No relevant information found."));
    return;
  }
  
  results.documents[0].forEach((doc, index) => {
    const distance = results.distances[0][index];
    const metadata = results.metadatas[0][index];
    
    console.log(chalk.blue.bold(`\n📄 Source: ${metadata.source}`));
    console.log(chalk.gray(`Chunk ${metadata.chunkIndex} | Similarity: ${(1 - distance).toFixed(3)}`));
    console.log(chalk.white(doc));
    
    if (index < results.documents[0].length - 1) {
      console.log(chalk.gray("\n" + "─".repeat(30)));
    }
  });
}

async function askQuestion(query) {
  try {
    console.log(chalk.yellow("🔮 Searching knowledge base..."));
    
    // Search for similar documents
    const results = await searchSimilarDocuments(query, 3);
    
    displayAnswer(query, results);
    
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
    console.log(chalk.green("✅ Database connection successful!\n"));
    
    promptUser();
    
  } catch (error) {
    console.error(chalk.red("❌ Error starting chat:"), error.message);
    console.log(chalk.yellow("Make sure you've run 'node processDocs.js' first to set up the database."));
    rl.close();
  }
}

// Start the chat interface
startChat();
