import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check chunks.json
const chunksPath = path.join(__dirname, "src/chunkData/chunks.json");
const chunks = JSON.parse(fs.readFileSync(chunksPath, "utf8"));

console.log(`Total chunks: ${chunks.length}\n`);

// Count by source
const sourceCounts = {};
chunks.forEach((chunk) => {
  sourceCounts[chunk.source] = (sourceCounts[chunk.source] || 0) + 1;
});

console.log("Chunks by source file:");
Object.entries(sourceCounts)
  .sort()
  .forEach(([source, count]) => {
    console.log(`  ${source}: ${count} chunks`);
  });

// Check fee files specifically
console.log("\n=== Fee Files Analysis ===");
const feeFiles = [
  "paypal_consumer_fees.json",
  "paypal_merchant_fees.json",
  "paypal_braintree_fees.json",
];

feeFiles.forEach((fileName) => {
  const fileChunks = chunks.filter((c) => c.source === fileName);
  console.log(`\n${fileName}: ${fileChunks.length} chunks`);

  if (fileChunks.length > 0) {
    console.log("Sample chunk text (first 200 chars):");
    console.log(`  "${fileChunks[0].text.substring(0, 200)}..."`);
  } else {
    console.log("  ⚠️ NO CHUNKS FOUND!");
  }
});

// Check if fee files exist in data directory
console.log("\n=== Fee Files in Data Directory ===");
const dataDir = path.join(__dirname, "src/data");
const files = fs.readdirSync(dataDir);
feeFiles.forEach((fileName) => {
  const exists = files.includes(fileName);
  console.log(`  ${fileName}: ${exists ? "✅ EXISTS" : "❌ MISSING"}`);
  if (exists) {
    const filePath = path.join(dataDir, fileName);
    const fileContent = JSON.parse(fs.readFileSync(filePath, "utf8"));
    console.log(
      `    Structure: ${Array.isArray(fileContent) ? "Array" : "Object"}`
    );
    console.log(
      `    Length: ${Array.isArray(fileContent) ? fileContent.length : "N/A"}`
    );
  }
});
