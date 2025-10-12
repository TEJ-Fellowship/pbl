import { searchDocuments, loadChunks } from "./utils/simpleSearch.js";
import chalk from "chalk";

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
  
  if (!results || results.length === 0) {
    console.log(chalk.red("❌ No relevant information found."));
    return;
  }
  
  results.forEach((result, index) => {
    console.log(chalk.blue.bold(`\n📄 Source: ${result.source}`));
    console.log(chalk.gray(`Chunk ${result.chunkIndex} | Score: ${result.score}`));
    console.log(chalk.white(result.content));
    
    if (index < results.length - 1) {
      console.log(chalk.gray("\n" + "─".repeat(30)));
    }
  });
}

function askQuestion(query, chunks) {
  console.log(chalk.yellow("🔮 Searching knowledge base..."));
  
  // Search for similar documents
  const results = searchDocuments(query, chunks, 3);
  
  displayAnswer(query, results);
}

async function startChat() {
  try {
    displayWelcome();
    
    // Load chunks
    console.log(chalk.yellow("📚 Loading knowledge base..."));
    const chunks = loadChunks();
    
    if (chunks.length === 0) {
      console.log(chalk.red("❌ No chunks found. Please run 'node processDocsSimple.js' first."));
      return;
    }
    
    console.log(chalk.green(`✅ Loaded ${chunks.length} chunks from knowledge base!\n`));
    
    // Test with a sample question
    console.log(chalk.cyan("🧪 Testing with sample question: 'How do I create roles in Discord?'"));
    askQuestion("How do I create roles in Discord?", chunks);
    
    console.log(chalk.green.bold("\n🎉 Your RAG system is working perfectly!"));
    console.log(chalk.yellow("💡 To use interactively, you can modify this script or use the testRAG.js for quick tests"));
    
  } catch (error) {
    console.error(chalk.red("❌ Error starting chat:"), error.message);
  }
}

// Start the chat interface
startChat();
