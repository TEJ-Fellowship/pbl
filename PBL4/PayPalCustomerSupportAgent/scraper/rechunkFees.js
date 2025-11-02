import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔄 Re-chunking fee files with improved table extraction...\n");

// Step 1: Run the chunking script
console.log("Step 1: Running chunk.js to re-chunk all files...");
try {
  execSync("node src/chunk.js", {
    cwd: __dirname,
    stdio: "inherit",
    encoding: "utf8",
  });
  console.log("✅ Chunking complete!\n");
} catch (error) {
  console.error("❌ Error during chunking:", error.message);
  process.exit(1);
}

// Step 2: Check if fee chunks are better now
console.log("Step 2: Verifying fee chunks...");
const chunksPath = path.join(__dirname, "src/chunkData/chunks.json");
const chunks = JSON.parse(fs.readFileSync(chunksPath, "utf8"));

const feeChunks = chunks.filter(
  (c) =>
    c.source.includes("fee") &&
    (c.source.includes("consumer") ||
      c.source.includes("merchant") ||
      c.source.includes("braintree"))
);

console.log(`\nFound ${feeChunks.length} fee-related chunks`);
if (feeChunks.length > 0) {
  const sample = feeChunks[0];
  console.log("\nSample fee chunk (first 500 chars):");
  console.log(sample.text.substring(0, 500));

  // Check if it contains actual fee data
  const hasFeeData =
    sample.text.includes("Fee") ||
    sample.text.includes("Rate") ||
    sample.text.includes("%") ||
    sample.text.includes("USD") ||
    sample.text.includes("Row");

  if (hasFeeData) {
    console.log("\n✅ Fee chunks contain actual fee data!");
  } else {
    console.log("\n⚠️ Fee chunks may still need improvement");
  }
}

console.log("\n📝 Next steps:");
console.log("1. Run the embedding script to re-embed chunks to Pinecone:");
console.log("   node embedwithXenovaclean.js");
console.log("\n2. Or run the PostgreSQL migration to update chunks table:");
console.log("   Check migrateData.js or upsert.js scripts");
