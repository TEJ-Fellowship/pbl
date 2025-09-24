import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

/**
 * Simple Text Splitter - Demonstrates document chunking
 * This is essential for creating embeddings and vector storage
 */
export class TextSplitter {
  constructor(options = {}) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: options.chunkSize || 1000, // Size of each chunk
      chunkOverlap: options.chunkOverlap || 200, // Overlap between chunks
      separators: options.separators || [
        // How to split text
        "\n\n", // Paragraphs
        "\n", // Lines
        " ", // Words
        "", // Characters
      ],
    });
  }

  /**
   * Split a single document into chunks
   * This is crucial for embedding generation and retrieval
   */
  async splitDocument(document) {
    console.log(`✂️ Splitting document: ${document.metadata.source}`);
    console.log(`📊 Original size: ${document.pageContent.length} characters`);

    const chunks = await this.splitter.splitDocuments([document]);

    console.log(`📦 Created ${chunks.length} chunks`);
    console.log(
      `📏 Average chunk size: ${Math.round(
        chunks.reduce((sum, chunk) => sum + chunk.pageContent.length, 0) /
          chunks.length
      )} characters`
    );

    return chunks;
  }

  /**
   * Split multiple documents
   */
  async splitDocuments(documents) {
    console.log(`✂️ Splitting ${documents.length} documents...`);

    const allChunks = [];
    for (const document of documents) {
      const chunks = await this.splitDocument(document);
      allChunks.push(...chunks);
    }

    console.log(`📦 Total chunks created: ${allChunks.length}`);
    return allChunks;
  }

  /**
   * Demonstrate chunking with detailed output
   */
  async demonstrateChunking(document) {
    console.log("\n🔍 CHUNKING DEMONSTRATION");
    console.log("=".repeat(50));

    const chunks = await this.splitDocument(document);

    // Show first few chunks as examples
    chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(`\n📄 Chunk ${index + 1}:`);
      console.log(`📏 Size: ${chunk.pageContent.length} characters`);
      console.log(`📝 Preview: ${chunk.pageContent.substring(0, 100)}...`);
      console.log(`🏷️ Metadata:`, chunk.metadata);
    });

    return chunks;
  }
}
