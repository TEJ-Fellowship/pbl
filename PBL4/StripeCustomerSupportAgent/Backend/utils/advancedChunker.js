import { CodeDetector } from "./codeDetector.js";
import { Document } from "@langchain/core/documents";

export class AdvancedChunker {
  constructor() {
    this.codeDetector = new CodeDetector();
  }

  // Extract metadata from URL and content
  extractMetadata(url, content, title) {
    const metadata = {
      source_url: url,
      last_updated: new Date().toISOString(),
      code_language: "none", // Default value instead of null
    };
    // Determine doc_type from URL
    if (url.includes("api")) metadata.doc_type = "api";
    else if (url.includes("guides")) metadata.doc_type = "guide";
    else if (url.includes("topics")) metadata.doc_type = "support";
    else metadata.doc_type = "api";
    // Determine category from URL
    if (url.includes("billing")) metadata.category = "billing";
    else if (url.includes("webhooks")) metadata.category = "webhooks";
    else if (url.includes("payments")) metadata.category = "payments";
    else if (url.includes("get-started")) metadata.category = "integration";
    else if (url.includes("disputes")) metadata.category = "disputes";
    else if (url.includes("connect")) metadata.category = "connect";
    else metadata.category = "general";
    // Detect if content has code
    const codeBlocks = this.codeDetector.extractCodeBlocks(content);
    if (codeBlocks.length > 0) {
      const languages = [...new Set(codeBlocks.map((block) => block.language))];
      metadata.code_language = languages.join(",");
    }

    return metadata;
  }

  // Create enhanced chunks with code separation
  async createEnhancedChunks(doc, textSplitter) {
    const chunks = [];
    const codeBlocks = this.codeDetector.extractCodeBlocks(doc.pageContent);
    // console.log("\n🔍 Code blocks:", codeBlocks);

    // Split main content (without code blocks)
    const cleanContent = this.codeDetector.removeCodeBlocks(doc.pageContent);
    const cleanDoc = new Document({
      pageContent: cleanContent,
      metadata: doc.metadata,
    });
    const mainChunks = await textSplitter.splitDocuments([cleanDoc]);
    // Add enhanced metadata to main chunks
    mainChunks.forEach((chunk, index) => {
      const enhancedMetadata = {
        ...doc.metadata,
        ...this.extractMetadata(
          doc.metadata.source,
          doc.pageContent,
          doc.metadata.title
        ),
        chunk_type: "explanation",
        chunk_index: index,
        total_chunks: mainChunks.length + codeBlocks.length,
      };

      chunks.push({
        ...chunk,
        metadata: enhancedMetadata,
      });
    });

    // Create separate chunks for code blocks
    codeBlocks.forEach((codeBlock, index) => {
      const codeChunk = {
        pageContent: codeBlock.code,
        metadata: {
          ...doc.metadata,
          ...this.extractMetadata(
            doc.metadata.source,
            doc.pageContent,
            doc.metadata.title
          ),
          chunk_type: "code",
          code_language: codeBlock.language,
          parent_chunk_id: `${doc.metadata.id}_chunk_${Math.floor(index / 2)}`,
          chunk_index: mainChunks.length + index,
          total_chunks: mainChunks.length + codeBlocks.length,
        },
      };

      chunks.push(codeChunk);
    });

    return chunks;
  }
}
