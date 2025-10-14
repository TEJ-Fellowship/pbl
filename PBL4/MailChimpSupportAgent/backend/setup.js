#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";

console.log("🔧 MailChimp Support Agent - Setup Helper");
console.log("=".repeat(50));

// Check if .env exists
const envPath = path.resolve(".env");
try {
  await fs.access(envPath);
  console.log("✅ .env file exists");
} catch {
  console.log("❌ .env file not found");
  console.log("📝 Creating .env template...");

  const envTemplate = `# MailChimp Support Agent Environment Variables
# Get your Gemini API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Get your Pinecone API key from: https://app.pinecone.io/
PINECONE_API_KEY=your_pinecone_api_key_here

# Pinecone index name (will be created if doesn't exist)
PINECONE_INDEX_NAME=mailerbyte-rag

# PostgreSQL Database Configuration (for BM25 search)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=postgres
DB_PASSWORD=password
DB_PORT=5432

# Chunking configuration
CHUNK_SIZE=600
CHUNK_OVERLAP=100
BATCH_SIZE=50

# Rate limiting (milliseconds)
RATE_LIMIT_DELAY=1000
`;

  await fs.writeFile(envPath, envTemplate);
  console.log("✅ Created .env template");
  console.log("📝 Please edit .env file with your API keys");
}

// Check data directory
const dataDir = path.resolve("./data");
try {
  await fs.access(dataDir);
  console.log("✅ Data directory exists");
} catch {
  console.log("📁 Creating data directory...");
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(path.join(dataDir, "mailerbyte_docs"), { recursive: true });
  await fs.mkdir(path.join(dataDir, "processed_chunks"), { recursive: true });
  console.log("✅ Data directories created");
}

// Check if scraped data exists
const scrapedPath = path.resolve("./data/mailerbyte_docs/scraped.json");
try {
  await fs.access(scrapedPath);
  const data = await fs.readFile(scrapedPath, "utf-8");
  const scrapedDocs = JSON.parse(data);
  console.log(`✅ Scraped data exists: ${scrapedDocs.length} documents`);
} catch {
  console.log("❌ No scraped data found");
  console.log("💡 Run: npm run scrape");
}

// Check if processed chunks exist
const chunksPath = path.resolve("./data/processed_chunks/chunks.json");
const enhancedChunksPath = path.resolve(
  "./data/processed_chunks/enhanced_chunks.json"
);

let chunksExist = false;
try {
  await fs.access(chunksPath);
  const data = await fs.readFile(chunksPath, "utf-8");
  const chunks = JSON.parse(data);
  console.log(`✅ Basic chunks exist: ${chunks.length} chunks`);
  chunksExist = true;
} catch {
  console.log("❌ No basic chunks found");
}

try {
  await fs.access(enhancedChunksPath);
  const data = await fs.readFile(enhancedChunksPath, "utf-8");
  const chunks = JSON.parse(data);
  console.log(`✅ Enhanced chunks exist: ${chunks.length} chunks`);
  chunksExist = true;
} catch {
  console.log("❌ No enhanced chunks found");
}

if (!chunksExist) {
  console.log("💡 Run: npm run enhanced-ingest");
}

console.log("\n🚀 NEXT STEPS:");
console.log("1. Edit .env file with your API keys and database credentials");
console.log("2. Install dependencies: npm install");
console.log("3. Set up PostgreSQL database: npm run db:setup");
console.log("4. Run: npm run scrape");
console.log("5. Run: npm run enhanced-ingest");
console.log("6. Populate PostgreSQL: npm run db:populate");
console.log("7. Run: npm run faq");

console.log("\n🔍 DEBUGGING:");
console.log("If FAQ interface shows 'No relevant information found':");
console.log("1. Check .env file has correct API keys");
console.log("2. Run ingestion process");
console.log("3. Make sure PostgreSQL database is populated");
console.log("4. Use 'Debug: Show system status' option in FAQ interface");
