import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("🔍 Environment Variables:");
console.log("========================");
console.log(
  `GEMINI_API_KEY: ${
    process.env.GEMINI_API_KEY
      ? "Set (" + process.env.GEMINI_API_KEY.substring(0, 10) + "...)"
      : "Not Set"
  }`
);
console.log(`GEMINI_MODEL: ${process.env.GEMINI_MODEL || "Not Set"}`);
console.log(`EMBEDDING_MODEL: ${process.env.EMBEDDING_MODEL || "Not Set"}`);
console.log(`DEBUG: ${process.env.DEBUG || "Not Set"}`);
console.log(
  `DEFAULT_DOCUMENT_PATH: ${process.env.DEFAULT_DOCUMENT_PATH || "Not Set"}`
);

console.log("\n🔧 Current Working Directory:");
console.log(process.cwd());

console.log("\n📁 Files in current directory:");
import fs from "fs";
const files = fs.readdirSync(".");
files.forEach((file) => {
  if (file.includes("env") || file.includes("config")) {
    console.log(`  ${file}`);
  }
});
