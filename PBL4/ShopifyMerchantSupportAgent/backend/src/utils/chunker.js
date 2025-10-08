import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { encodingForModel } from "js-tiktoken";

// Get current directory for absolute paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../../../data/shopify_docs");
const OUTPUT_DIR = path.join(__dirname, "../../../data/chunks");

// Load tokenizer (for accurate token counting)
const tokenizer = encodingForModel("gpt-3.5-turbo");

// Helper: count tokens in text
function countTokens(text) {
  try {
    return tokenizer.encode(text).length;
  } catch (error) {
    console.warn(
      `⚠️ Token counting failed for text, using character count/4: ${error.message}`
    );
    return Math.ceil(text.length / 4); // Rough estimation
  }
}

// Helper: determine merchant level based on content
function determineMerchantLevel(content, category) {
  const advancedKeywords = [
    "api",
    "liquid",
    "webhook",
    "metafield",
    "script tag",
    "theme development",
    "javascript",
    "css",
    "html",
    "custom code",
    "integration",
    "automation",
    "bulk operations",
    "csv import",
    "developer",
    "programming",
    "customize theme",
  ];

  const beginnerKeywords = [
    "getting started",
    "setup",
    "basic",
    "simple",
    "first time",
    "new to",
    "introduction",
    "overview",
    "getting set up",
    "checklist",
    "tutorial",
  ];

  const lowerContent = content.toLowerCase();

  // Check for advanced content
  const hasAdvanced = advancedKeywords.some((keyword) =>
    lowerContent.includes(keyword)
  );
  const hasBeginner = beginnerKeywords.some((keyword) =>
    lowerContent.includes(keyword)
  );

  // Category-based classification
  if (category === "manual_getting_started") return "beginner";
  if (category === "helpCenter") return "beginner";

  // Content-based classification
  if (hasAdvanced && !hasBeginner) return "advanced";
  if (hasBeginner) return "beginner";

  // Default based on category
  if (category.includes("products") || category.includes("orders"))
    return "intermediate";

  return "beginner";
}

// Helper: extract section from content
function extractSection(content, title) {
  // Try to find section headers in content
  const sectionMatches = content.match(/^([A-Z][^.\n]{10,50})$/gm);
  if (sectionMatches && sectionMatches.length > 0) {
    return sectionMatches[0].trim();
  }

  // Fallback to title
  if (title && title !== "Untitled") {
    return title;
  }

  return "General";
}

async function main() {
  try {
    await fs.ensureDir(OUTPUT_DIR);
    const files = await fs.readdir(DATA_DIR);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 700, // Updated to meet requirement of 700 tokens
      chunkOverlap: 100,
      separators: ["\n\n", "\n", ". ", " ", ""], // Better text splitting
    });

    console.log(`📁 Processing ${files.length} files from ${DATA_DIR}`);

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      try {
        const filePath = path.join(DATA_DIR, file);
        const doc = await fs.readJson(filePath);

        const fullText = doc.content || "";
        const title = doc.title || "Untitled";

        if (!fullText.trim()) {
          console.warn(`⚠️ Empty content in ${file}, skipping...`);
          continue;
        }

        // Clean and preserve code blocks
        const textWithCodeBlocks = fullText.replace(
          /```[\s\S]*?```/g,
          (block) => `\n${block}\n`
        );

        // Split into chunks
        const chunks = await splitter.splitText(textWithCodeBlocks);

        const chunkData = chunks.map((chunk, i) => {
          const tokenCount = countTokens(chunk);
          const merchantLevel = determineMerchantLevel(chunk, doc.category);
          const section = extractSection(chunk, title);

          return {
            id: `${file.replace(".json", "")}_chunk_${i}`,
            text: chunk.trim(),
            tokens: tokenCount,
            metadata: {
              title,
              section,
              source: doc.url,
              category: doc.category,
              merchant_level: merchantLevel,
              scraped_at: doc.scrapedAt,
              chunk_index: i,
              total_chunks: chunks.length,
            },
          };
        });

        // Save chunks with descriptive filename
        const outputFileName = `chunks_${file.replace(".json", "")}.json`;
        const outputPath = path.join(OUTPUT_DIR, outputFileName);

        await fs.writeJson(outputPath, chunkData, { spaces: 2 });

        const avgTokens = Math.round(
          chunkData.reduce((sum, chunk) => sum + chunk.tokens, 0) /
            chunkData.length
        );
        console.log(
          `✅ Chunked ${file} → ${chunkData.length} chunks (avg ${avgTokens} tokens each)`
        );
      } catch (error) {
        console.error(`❌ Failed to process ${file}:`, error.message);
      }
    }

    console.log("🎉 All documents chunked successfully!");
    console.log(`📂 Chunks saved to: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

main();
