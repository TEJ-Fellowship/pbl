// Enhanced chunking with better semantic boundaries and context preservation
import { estimateTokens } from "./chunker.js";

/**
 * Enhanced chunking that preserves semantic boundaries and context
 */
export function createEnhancedChunks(options = {}) {
  const {
    text,
    chunkSizeTokens = 1200, // Increased for better context
    chunkOverlapTokens = 200,
    preserveCodeBlocks = true,
    preserveHeadings = true,
    preserveLists = true,
    minChunkSize = 200, // Minimum chunk size to avoid tiny fragments
  } = options || {};

  if (!text || text.trim().length === 0) return [];

  // Step 1: Split by major semantic boundaries
  const semanticSections = splitBySemanticBoundaries(text);

  // Step 2: Process each section
  const chunks = [];

  for (const section of semanticSections) {
    if (estimateTokens(section.content) <= chunkSizeTokens) {
      // Section fits in one chunk
      chunks.push({
        content: section.content,
        metadata: section.metadata,
        tokens: estimateTokens(section.content),
      });
    } else {
      // Split large sections while preserving structure
      const subChunks = splitLargeSection(section, {
        chunkSizeTokens,
        chunkOverlapTokens,
        preserveCodeBlocks,
        preserveHeadings,
        preserveLists,
      });
      chunks.push(...subChunks);
    }
  }

  // Step 3: Add overlap between chunks
  return addSemanticOverlap(chunks, chunkOverlapTokens, minChunkSize);
}

/**
 * Split text by semantic boundaries (headings, code blocks, lists)
 */
function splitBySemanticBoundaries(text) {
  const sections = [];
  let currentSection = { content: "", metadata: {} };

  // Split by major headings first
  const headingSplit = text.split(/(\n#{1,6}\s+.+)/);

  for (let i = 0; i < headingSplit.length; i++) {
    const part = headingSplit[i].trim();
    if (!part) continue;

    if (part.match(/^#{1,6}\s+/)) {
      // This is a heading
      if (currentSection.content.trim()) {
        sections.push(currentSection);
        currentSection = { content: "", metadata: {} };
      }
      currentSection.metadata.heading = part;
      currentSection.content = part + "\n\n";
    } else {
      currentSection.content += part + "\n\n";
    }
  }

  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }

  // If no headings found, split by paragraphs
  if (sections.length === 0) {
    const paragraphs = text.split(/\n{2,}/);
    for (const para of paragraphs) {
      if (para.trim()) {
        sections.push({
          content: para.trim(),
          metadata: {},
        });
      }
    }
  }

  return sections;
}

/**
 * Split large sections while preserving code blocks and structure
 */
function splitLargeSection(section, options) {
  const { chunkSizeTokens, preserveCodeBlocks, preserveHeadings } = options;
  const chunks = [];

  // First, extract and preserve code blocks
  const codeBlocks = [];
  let textWithoutCode = section.content;

  if (preserveCodeBlocks) {
    const codeRegex = /```[\s\S]*?```/g;
    let match;
    while ((match = codeRegex.exec(section.content)) !== null) {
      codeBlocks.push({
        content: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    // Remove code blocks from text for chunking
    textWithoutCode = section.content.replace(
      codeRegex,
      `[CODE_BLOCK_${codeBlocks.length}]`
    );
  }

  // Split the text without code blocks
  const textChunks = splitTextIntoOptimalChunks(
    textWithoutCode,
    chunkSizeTokens
  );

  // Reinsert code blocks into appropriate chunks
  for (let i = 0; i < textChunks.length; i++) {
    let chunkContent = textChunks[i];

    // Reinsert code blocks that belong to this chunk
    if (preserveCodeBlocks) {
      codeBlocks.forEach((codeBlock, index) => {
        const placeholder = `[CODE_BLOCK_${index + 1}]`;
        if (chunkContent.includes(placeholder)) {
          chunkContent = chunkContent.replace(placeholder, codeBlock.content);
        }
      });
    }

    chunks.push({
      content: chunkContent.trim(),
      metadata: {
        ...section.metadata,
        chunkIndex: i,
        totalChunks: textChunks.length,
      },
      tokens: estimateTokens(chunkContent),
    });
  }

  return chunks;
}

/**
 * Split text into optimal chunks based on token count
 */
function splitTextIntoOptimalChunks(text, maxTokens) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  let currentChunk = "";
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (currentTokens + sentenceTokens > maxTokens && currentChunk.trim()) {
      // Current chunk is full, start a new one
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      currentTokens = sentenceTokens;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
      currentTokens += sentenceTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Add semantic overlap between chunks
 */
function addSemanticOverlap(chunks, overlapTokens, minChunkSize) {
  if (chunks.length <= 1) return chunks;

  const overlappedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    let chunk = chunks[i];

    // Add overlap from previous chunk
    if (i > 0) {
      const prevChunk = chunks[i - 1];
      const overlap = extractSemanticOverlap(prevChunk.content, overlapTokens);

      if (overlap) {
        chunk.content = overlap + "\n\n" + chunk.content;
        chunk.tokens = estimateTokens(chunk.content);
      }
    }

    // Only include chunks that meet minimum size
    if (chunk.tokens >= minChunkSize) {
      overlappedChunks.push(chunk);
    }
  }

  return overlappedChunks;
}

/**
 * Extract semantic overlap from previous chunk
 */
function extractSemanticOverlap(content, targetTokens) {
  const sentences = content.split(/(?<=[.!?])\s+/);
  let overlap = "";
  let tokens = 0;

  // Start from the end and work backwards
  for (let i = sentences.length - 1; i >= 0; i--) {
    const sentence = sentences[i];
    const sentenceTokens = estimateTokens(sentence);

    if (tokens + sentenceTokens <= targetTokens) {
      overlap = sentence + (overlap ? " " : "") + overlap;
      tokens += sentenceTokens;
    } else {
      break;
    }
  }

  return overlap.trim();
}

/**
 * Enhanced chunking for documents with metadata
 */
export function chunkDocument(document, options = {}) {
  const {
    chunkSizeTokens = 1200,
    chunkOverlapTokens = 200,
    preserveCodeBlocks = true,
    preserveHeadings = true,
    preserveLists = true,
    minChunkSize = 200,
  } = options;

  // Extract base metadata
  const baseMetadata = {
    title: document.title || "Unknown",
    section: document.section || "unknown",
    source: document.url || "N/A",
    category: document.section || "unknown",
    merchant_level: document.merchant_level || "intermediate",
    scraped_at: document.scrapedAt || new Date().toISOString(),
  };

  // Create chunks
  const chunks = createEnhancedChunks({
    text: document.content,
    chunkSizeTokens,
    chunkOverlapTokens,
    preserveCodeBlocks,
    preserveHeadings,
    preserveLists,
    minChunkSize,
  });

  // Add metadata and IDs to chunks
  return chunks.map((chunk, index) => ({
    id: `${document.section || "doc"}-${Date.now()}-${index}`,
    text: chunk.content,
    tokens: chunk.tokens,
    metadata: {
      ...baseMetadata,
      ...chunk.metadata,
      chunk_index: index,
      total_chunks: chunks.length,
      content_length: chunk.content.length,
      word_count: chunk.content.split(/\s+/).length,
    },
  }));
}

/**
 * Process multiple documents and create comprehensive chunks
 */
export function processDocuments(documents, options = {}) {
  const allChunks = [];

  for (const doc of documents) {
    try {
      const chunks = chunkDocument(doc, options);
      allChunks.push(...chunks);
      console.log(`✅ Processed ${doc.section}: ${chunks.length} chunks`);
    } catch (error) {
      console.error(`❌ Error processing ${doc.section}:`, error.message);
    }
  }

  console.log(`📊 Total chunks created: ${allChunks.length}`);
  return allChunks;
}
