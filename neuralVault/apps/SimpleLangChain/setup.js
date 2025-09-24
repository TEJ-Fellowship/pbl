import fs from "fs";

console.log("🚀 LangChain Setup");
console.log("=".repeat(20));

// Check .env file
if (!fs.existsSync(".env")) {
  console.log("Creating .env file...");
  fs.writeFileSync(".env", "GEMINI_API_KEY=your_api_key_here\n");
  console.log("✅ .env file created");
} else {
  console.log("✅ .env file exists");
}

// Check data directory
if (!fs.existsSync("test/data")) {
  fs.mkdirSync("test/data", { recursive: true });
  console.log("✅ Data directory created");
} else {
  console.log("✅ Data directory exists");
}

console.log("\n🎯 Next Steps:");
console.log("1. Add your GEMINI_API_KEY to .env file");
console.log("2. Add PDF files to test/data/ directory");
console.log("3. Run: npm start");
