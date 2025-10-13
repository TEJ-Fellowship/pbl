import { searchDocuments, loadChunks } from "./utils/simpleSearch.js";
import chalk from "chalk";
import readline from "readline";

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

function promptUser(chunks) {
  rl.question(chalk.cyan("\n❓ Ask a question: "), async (input) => {
    const query = input.trim();
    
    if (query.toLowerCase() === 'exit' || query.toLowerCase() === 'quit') {
      console.log(chalk.green("👋 Thanks for using Discord Community Support Agent!"));
      rl.close();
      return;
    }
    
    if (query === '') {
      console.log(chalk.red("Please enter a question."));
      promptUser(chunks);
      return;
    }
    
    askQuestion(query, chunks);
    promptUser(chunks);
  });
}

async function startChat() {
  try {
    displayWelcome();
    
    // Load chunks
    console.log(chalk.yellow("📚 Loading knowledge base..."));
    const chunks = loadChunks();
    
    if (chunks.length === 0) {
      console.log(chalk.red("❌ No chunks found. Please run 'node processDocs.js' first."));
      rl.close();
      return;
    }
    
    console.log(chalk.green(`✅ Loaded ${chunks.length} chunks from knowledge base!\n`));
    
    promptUser(chunks);
    
  } catch (error) {
    console.error(chalk.red("❌ Error starting chat:"), error.message);
    rl.close();
  }
}

// Start the chat interface
startChat();
