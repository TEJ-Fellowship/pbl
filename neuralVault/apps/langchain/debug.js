import { config } from "./src/config/index.js";
import chalk from "chalk";
import fs from "fs";
import path from "path";

console.log(chalk.blue("🔍 Debugging LangChain Configuration..."));
console.log(chalk.blue("====================================="));

// Check if .env file exists
const envPath = path.join(process.cwd(), ".env");
console.log(chalk.yellow(`📁 Checking for .env file: ${envPath}`));
console.log(chalk.white(`   Exists: ${fs.existsSync(envPath)}`));

if (fs.existsSync(envPath)) {
  console.log(chalk.green("✅ .env file found"));

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(chalk.yellow("🔑 Checking GEMINI_API_KEY:"));
  console.log(chalk.white(`   Set: ${!!apiKey}`));
  console.log(chalk.white(`   Length: ${apiKey ? apiKey.length : 0}`));
  console.log(
    chalk.white(
      `   Starts with: ${apiKey ? apiKey.substring(0, 10) + "..." : "N/A"}`
    )
  );
} else {
  console.log(chalk.red("❌ .env file not found"));
  console.log(chalk.yellow("💡 Create .env file by copying env.example"));
}

// Check PDF file
const pdfPath = path.join(process.cwd(), "docs", "sample_langchain_doc.pdf");
console.log(chalk.yellow(`📄 Checking PDF file: ${pdfPath}`));
console.log(chalk.white(`   Exists: ${fs.existsSync(pdfPath)}`));

// Test config validation
console.log(chalk.yellow("⚙️ Testing configuration validation:"));
try {
  const isValid = config.validate();
  console.log(chalk.white(`   Valid: ${isValid}`));

  if (isValid) {
    config.printConfig();
  }
} catch (error) {
  console.log(chalk.red(`   Error: ${error.message}`));
}

console.log(chalk.blue("🔍 Debug complete"));
console.log(chalk.blue("====================================="));
