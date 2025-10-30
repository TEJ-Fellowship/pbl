import { CodeDetector } from "./codeDetector.js";
import { Document } from "@langchain/core/documents";

export class AdvancedChunker {
  constructor() {
    this.codeDetector = new CodeDetector();
  }

  // 🧠 Extract Twilio-specific metadata
  extractMetadata(url, content, title = "") {
    const metadata = {
      source_url: url,
      title,
      last_updated: new Date().toISOString(),
      doc_type: "general",
      category: "general",
      code_language: "none",
      platform: "Twilio",
    };

    // 🔍 Determine doc type
    if (url.includes("support.twilio.com")) metadata.doc_type = "support";
    else if (url.includes("quickstart")) metadata.doc_type = "quickstart";
    else if (url.includes("api")) metadata.doc_type = "api";
    else if (url.includes("libraries")) metadata.doc_type = "sdk";
    else metadata.doc_type = "guide";

    // 🎯 Determine feature category
    if (url.includes("/sms")) metadata.category = "sms";
    else if (url.includes("/voice")) metadata.category = "voice";
    else if (url.includes("/whatsapp")) metadata.category = "whatsapp";
    else if (url.includes("/video")) metadata.category = "video";
    else if (url.includes("/usage/webhooks")) metadata.category = "webhooks";
    else if (url.includes("/api/errors")) metadata.category = "errors";
    else if (url.includes("/billing")) metadata.category = "billing";
    else if (url.includes("/connect")) metadata.category = "connect";
    else metadata.category = "general";

    // 💬 Extract code blocks and detect languages
    const codeBlocks = this.codeDetector.extractCodeBlocks(content);
    if (codeBlocks.length > 0) {
      const languages = [...new Set(codeBlocks.map((b) => b.language || "unknown"))];
      metadata.code_language = languages.join(",");
    }

    return metadata;
  }

  // 🧩 Create Twilio-enhanced chunks
  async createEnhancedChunks(doc, textSplitter) {
    const chunks = [];
    const codeBlocks = this.codeDetector.extractCodeBlocks(doc.pageContent);

    // Remove code for clean text
    const cleanContent = this.codeDetector.removeCodeBlocks(doc.pageContent);
    const cleanDoc = new Document({
      pageContent: cleanContent,
      metadata: doc.metadata,
    });

    // Split main text into smaller parts
    const mainChunks = await textSplitter.splitDocuments([cleanDoc]);

    // 🧱 Process explanation chunks
    mainChunks.forEach((chunk, index) => {
      const enhancedMeta = {
        ...doc.metadata,
        ...this.extractMetadata(doc.metadata.source, doc.pageContent, doc.metadata.title),
        chunk_type: "explanation",
        chunk_index: index,
        total_chunks: mainChunks.length + codeBlocks.length,
      };

      chunks.push({
        ...chunk,
        metadata: enhancedMeta,
      });
    });

    // 💻 Process code blocks separately
    codeBlocks.forEach((codeBlock, index) => {
      const codeMeta = {
        ...doc.metadata,
        ...this.extractMetadata(doc.metadata.source, doc.pageContent, doc.metadata.title),
        chunk_type: "code",
        code_language: codeBlock.language,
        parent_chunk_id: `${doc.metadata.id}_chunk_${Math.floor(index / 2)}`,
        chunk_index: mainChunks.length + index,
        total_chunks: mainChunks.length + codeBlocks.length,
      };

      chunks.push({
        pageContent: codeBlock.code,
        metadata: codeMeta,
      });
    });

    return chunks;
  }
}
