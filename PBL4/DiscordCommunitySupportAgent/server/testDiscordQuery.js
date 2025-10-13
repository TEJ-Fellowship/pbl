import { searchDocuments, loadChunks } from "./utils/simpleSearch.js";
import chalk from "chalk";

function testSpecificQuery() {
  console.log(chalk.blue.bold("🧪 Testing: 'What is Discord?'"));
  console.log(chalk.gray("=" .repeat(50)));
  
  // Load chunks
  const chunks = loadChunks();
  
  if (chunks.length === 0) {
    console.log(chalk.red("❌ No chunks found."));
    return;
  }
  
  console.log(chalk.green(`✅ Loaded ${chunks.length} chunks\n`));
  
  // Test the specific query
  const query = "What is Discord?";
  console.log(chalk.cyan(`🔍 Query: ${query}`));
  console.log(chalk.gray("-".repeat(50)));
  
  const results = searchDocuments(query, chunks, 3);
  
  if (results.length > 0) {
    results.forEach((result, i) => {
      console.log(chalk.blue.bold(`📄 Source: ${result.source} | Score: ${result.score}`));
      console.log(chalk.white(result.content.substring(0, 300) + "..."));
      if (i < results.length - 1) console.log(chalk.gray("\n" + "─".repeat(30)));
    });
  } else {
    console.log(chalk.red("❌ No results found"));
  }
  
  console.log(chalk.green.bold("\n💡 The improved search should now prioritize:"));
  console.log(chalk.yellow("1. Chunks that actually define 'Discord is...'"));
  console.log(chalk.yellow("2. Beginner guide content"));
  console.log(chalk.yellow("3. Lower scores for unrelated content"));
}

testSpecificQuery();
