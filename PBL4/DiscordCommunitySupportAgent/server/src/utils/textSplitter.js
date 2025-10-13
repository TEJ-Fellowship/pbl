import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { config } from "../config/index.js";

class TextSplitter {
  constructor() {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.textProcessing.maxChunkSize,
      chunkOverlap: config.textProcessing.chunkOverlap,
      separators: [
        "\n\n", // Paragraph breaks
        "\n", // Line breaks
        ". ", // Sentence endings
        "! ", // Exclamation sentences
        "? ", // Question sentences
        "; ", // Semicolon breaks
        ", ", // Comma breaks
        " ", // Word breaks
        "", // Character breaks],
      ],
    });
  }

  async splitText(text, metadata = {}) {
    try {
      //clean and preprocess the text
      const cleanedText = this.preprocessText(text);

      // split text into chunks
      const chunks = await this.splitter.splitText(cleanedText);

      // filter out chunks that are too small
      const validChunks = chunks.filter(
        (chunk) => chunk.length >= config.textProcessing.minChunkSize
      );

      const chunksWithMetadata = validChunks.map((chunk, index) => ({
        text: chunk,
        metadata: {
          ...metadata,
          chunkIndex: index,
          chunkLength: chunk.length,
          totalChunks: validChunks.length,
        },
      }));

      console.log(
        `Split text into ${validChunks.length} chunks using langchain`
      );
      return chunksWithMetadata;
    } catch (error) {
      console.error(`Failed to split the text`, error.message);
      throw error;
    }
  }

  preprocessText(text) {
    return (
      text
        // Remove excessive whitespace
        .replace(/\s+/g, " ")
        // Remove HTML tags but preserve content
        .replace(/<[^>]*>/g, "")
        // Clean up Discord-specific formatting
        .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
        .replace(/\*(.*?)\*/g, "$1") // Italic
        .replace(/`(.*?)`/g, "$1") // Code
        .replace(/~~(.*?)~~/g, "$1") // Strikethrough
        // Preserve important Discord emojis and indicators
        .replace(/⚙️/g, "⚙️ ")
        .replace(/🔒/g, "🔒 ")
        .replace(/➕/g, "➕ ")
        .replace(/❌/g, "❌ ")
        .replace(/✅/g, "✅ ")
        .trim()
    );
  }

  async splitStepByStepGuide(text, metadata = {}) {
    const steps = text.split(/(?=\d+\.|\*\s*\d+\.|Step\s*\d+)/i);
    const chunks = [];

    steps.forEach((step, index) => {
      if (step.trim().length() > config.textProcessing.minChunkSize) {
        chunks.push({
          text: step.trim(),
          metadata: {
            ...metadata,
            chunkIndex: index,
            chunkLength: steps.length(),
            isStepByStep: true,
            stepNumber: index + 1,
          },
        });
      }
    });

    return chunks;
  }
}

export default TextSplitter;
