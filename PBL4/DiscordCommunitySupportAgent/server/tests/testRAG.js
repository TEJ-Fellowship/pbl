import { searchDocuments, loadChunks } from "./utils/simpleSearch.js";
import chalk from "chalk";

function testSearch() {
  console.log(chalk.blue.bold("🎮 Discord Community Support Agent - Quick Test"));
  console.log(chalk.gray("=" .repeat(50)));
  
  // Load chunks
  console.log(chalk.yellow("📚 Loading knowledge base..."));
  const chunks = loadChunks();
  
  if (chunks.length === 0) {
    console.log(chalk.red("❌ No chunks found. Please run 'node processDocsSimple.js' first."));
    return;
  }
  
  console.log(chalk.green(`✅ Loaded ${chunks.length} chunks from knowledge base!\n`));
  
  // Test some queries
  const testQueries = [
    "How do I create roles in Discord?",
    "What are Discord webhooks?",
    "How do I set up server permissions?"
  ];
  
  testQueries.forEach((query, index) => {
    console.log(chalk.cyan(`\n🔍 Test Query ${index + 1}: ${query}`));
    console.log(chalk.gray("-".repeat(50)));
    
    const results = searchDocuments(query, chunks, 2);
    
    if (results.length > 0) {
      results.forEach((result, i) => {
        console.log(chalk.blue.bold(`📄 Source: ${result.source} | Score: ${result.score}`));
        console.log(chalk.white(result.content.substring(0, 200) + "..."));
        if (i < results.length - 1) console.log(chalk.gray("─".repeat(30)));
      });
    } else {
      console.log(chalk.red("❌ No results found"));
    }
  });
  
  console.log(chalk.green.bold("\n🎉 Test completed! Your RAG system is working!"));
  console.log(chalk.yellow("💡 To use interactively, run: node simpleChat.js"));
}

testSearch();
