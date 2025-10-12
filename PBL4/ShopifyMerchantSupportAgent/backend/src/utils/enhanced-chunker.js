// Enhanced chunker with intelligent text segmentation and metadata enrichment
export function estimateTokens(t) {
  if (!t) return 0;
  const byChars = Math.ceil(t.length / 4);
  const byWords = (t.match(/\S+/g) || []).length;
  return Math.max(byWords, byChars);
}

/**
 * Enhanced text chunking with intelligent segmentation
 * Features:
 * - Semantic boundary detection
 * - Technical content preservation
 * - Metadata enrichment
 * - Adaptive chunk sizing
 */
export function splitTextIntoEnhancedChunks(options) {
  const {
    text,
    // Optimized chunk sizes for better search
    chunkSizeChars = 2000, // Reduced for more focused chunks
    chunkOverlapChars = 300,
    // Token-aware settings
    chunkSizeTokens,
    chunkOverlapTokens,
    model,
    // Enhanced options
    preserveCodeBlocks = true,
    preserveTechnicalContent = true,
    enrichMetadata = true,
  } = options || {};

  if (!text) return [];

  const useTokens = Number.isFinite(chunkSizeTokens) && chunkSizeTokens > 0;
  const countTokens = estimateTokens;

  // First, identify semantic boundaries
  const semanticBoundaries = identifySemanticBoundaries(text);

  // Split by semantic boundaries first
  const semanticSegments = splitBySemanticBoundaries(text, semanticBoundaries);

  // Then chunk each segment
  const chunks = [];

  for (const segment of semanticSegments) {
    if (segment.length <= chunkSizeChars) {
      // Segment fits in one chunk
      chunks.push(segment);
    } else {
      // Need to further chunk this segment
      const subChunks = chunkSegment(segment, {
        chunkSizeChars,
        chunkOverlapChars,
        useTokens,
        chunkSizeTokens,
        preserveCodeBlocks,
        preserveTechnicalContent,
      });
      chunks.push(...subChunks);
    }
  }

  // Add overlap between chunks
  const chunksWithOverlap = addIntelligentOverlap(chunks, {
    chunkOverlapChars,
    chunkOverlapTokens,
    useTokens,
  });

  // Enrich chunks with metadata
  if (enrichMetadata) {
    return chunksWithOverlap.map((chunk, index) => ({
      text: chunk,
      metadata: enrichChunkMetadata(chunk, index, options),
    }));
  }

  return chunksWithOverlap;
}

/**
 * Identify semantic boundaries in text
 */
function identifySemanticBoundaries(text) {
  const boundaries = [];

  // Headers and titles
  const headerPatterns = [
    /^#{1,6}\s+.+$/gm, // Markdown headers
    /^[A-Z][A-Z\s]+$/gm, // ALL CAPS headers
    /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/gm, // Title Case headers
  ];

  headerPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      boundaries.push({
        type: "header",
        position: match.index,
        content: match[0],
      });
    }
  });

  // Code blocks
  const codePattern = /```[\s\S]*?```/g;
  let match;
  while ((match = codePattern.exec(text)) !== null) {
    boundaries.push({
      type: "code_block",
      position: match.index,
      content: match[0],
    });
  }

  // Lists
  const listPattern = /^(?:\s*[-*+]|\s*\d+\.)\s+.+$/gm;
  while ((match = listPattern.exec(text)) !== null) {
    boundaries.push({
      type: "list",
      position: match.index,
      content: match[0],
    });
  }

  // Paragraph breaks
  const paragraphPattern = /\n\s*\n/g;
  while ((match = paragraphPattern.exec(text)) !== null) {
    boundaries.push({
      type: "paragraph",
      position: match.index,
      content: match[0],
    });
  }

  // Sort by position
  boundaries.sort((a, b) => a.position - b.position);

  return boundaries;
}

/**
 * Split text by semantic boundaries
 */
function splitBySemanticBoundaries(text, boundaries) {
  if (boundaries.length === 0) {
    return [text];
  }

  const segments = [];
  let lastIndex = 0;

  for (const boundary of boundaries) {
    if (boundary.position > lastIndex) {
      const segment = text.slice(lastIndex, boundary.position).trim();
      if (segment.length > 0) {
        segments.push(segment);
      }
    }
    lastIndex = boundary.position + boundary.content.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const segment = text.slice(lastIndex).trim();
    if (segment.length > 0) {
      segments.push(segment);
    }
  }

  return segments;
}

/**
 * Chunk a single segment with enhanced logic
 */
function chunkSegment(segment, options) {
  const {
    chunkSizeChars,
    chunkOverlapChars,
    useTokens,
    chunkSizeTokens,
    preserveCodeBlocks,
    preserveTechnicalContent,
  } = options;

  const chunks = [];

  if (preserveCodeBlocks) {
    // Split around code blocks
    const parts = segment.split(/(```[\s\S]*?```)/g);
    let currentChunk = "";

    for (const part of parts) {
      if (!part) continue;

      if (/^```[\s\S]*?```$/.test(part)) {
        // This is a code block
        const candidateChunk = currentChunk + part;

        if (useTokens) {
          if (countTokens(candidateChunk) <= chunkSizeTokens) {
            currentChunk = candidateChunk;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = part;
          }
        } else {
          if (candidateChunk.length <= chunkSizeChars) {
            currentChunk = candidateChunk;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = part;
          }
        }
      } else {
        // Regular text
        const subChunks = chunkRegularText(part, {
          chunkSizeChars,
          chunkSizeTokens,
          useTokens,
          preserveTechnicalContent,
        });

        if (subChunks.length === 1) {
          const candidateChunk = currentChunk + subChunks[0];

          if (useTokens) {
            if (countTokens(candidateChunk) <= chunkSizeTokens) {
              currentChunk = candidateChunk;
            } else {
              if (currentChunk) {
                chunks.push(currentChunk.trim());
              }
              currentChunk = subChunks[0];
            }
          } else {
            if (candidateChunk.length <= chunkSizeChars) {
              currentChunk = candidateChunk;
            } else {
              if (currentChunk) {
                chunks.push(currentChunk.trim());
              }
              currentChunk = subChunks[0];
            }
          }
        } else {
          // Multiple sub-chunks
          if (currentChunk) {
            chunks.push(currentChunk.trim());
          }
          chunks.push(...subChunks);
          currentChunk = "";
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
  } else {
    // Regular chunking
    chunks.push(
      ...chunkRegularText(segment, {
        chunkSizeChars,
        chunkSizeTokens,
        useTokens,
        preserveTechnicalContent,
      })
    );
  }

  return chunks;
}

/**
 * Chunk regular text with technical content preservation
 */
function chunkRegularText(text, options) {
  const {
    chunkSizeChars,
    chunkSizeTokens,
    useTokens,
    preserveTechnicalContent,
  } = options;

  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  let currentChunk = "";

  for (const sentence of sentences) {
    const candidateChunk = currentChunk
      ? currentChunk + " " + sentence
      : sentence;

    const withinBudget = useTokens
      ? countTokens(candidateChunk) <= chunkSizeTokens
      : candidateChunk.length <= chunkSizeChars;

    if (withinBudget) {
      currentChunk = candidateChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      // Check if sentence itself is too long
      if (
        useTokens
          ? countTokens(sentence) > chunkSizeTokens
          : sentence.length > chunkSizeChars
      ) {
        // Split long sentence by words
        const words = sentence.split(/\s+/);
        let wordChunk = "";

        for (const word of words) {
          const candidateWordChunk = wordChunk ? wordChunk + " " + word : word;

          const wordWithinBudget = useTokens
            ? countTokens(candidateWordChunk) <= chunkSizeTokens
            : candidateWordChunk.length <= chunkSizeChars;

          if (wordWithinBudget) {
            wordChunk = candidateWordChunk;
          } else {
            if (wordChunk) {
              chunks.push(wordChunk.trim());
            }
            wordChunk = word;
          }
        }

        if (wordChunk) {
          currentChunk = wordChunk;
        } else {
          currentChunk = "";
        }
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Add intelligent overlap between chunks
 */
function addIntelligentOverlap(chunks, options) {
  const { chunkOverlapChars, chunkOverlapTokens, useTokens } = options;

  if (chunks.length <= 1) {
    return chunks;
  }

  const chunksWithOverlap = [];

  for (let i = 0; i < chunks.length; i++) {
    let chunk = chunks[i];

    if (i > 0) {
      // Add overlap from previous chunk
      const prevChunk = chunks[i - 1];
      const overlap = extractIntelligentOverlap(prevChunk, {
        chunkOverlapChars,
        chunkOverlapTokens,
        useTokens,
      });

      if (overlap) {
        chunk = overlap + "\n\n" + chunk;
      }
    }

    chunksWithOverlap.push(chunk);
  }

  return chunksWithOverlap;
}

/**
 * Extract intelligent overlap from chunk
 */
function extractIntelligentOverlap(chunk, options) {
  const { chunkOverlapChars, chunkOverlapTokens, useTokens } = options;

  if (useTokens) {
    // Token-based overlap
    const targetTokens = chunkOverlapTokens || 0;
    if (targetTokens <= 0) return "";

    const sentences = chunk.split(/(?<=[.!?])\s+/);
    let overlap = "";

    for (let i = sentences.length - 1; i >= 0; i--) {
      const candidateOverlap = sentences[i] + (overlap ? " " + overlap : "");
      if (countTokens(candidateOverlap) <= targetTokens) {
        overlap = candidateOverlap;
      } else {
        break;
      }
    }

    return overlap;
  } else {
    // Character-based overlap
    const targetChars = chunkOverlapChars || 0;
    if (targetChars <= 0) return "";

    return chunk.slice(Math.max(0, chunk.length - targetChars));
  }
}

/**
 * Enrich chunk with metadata
 */
function enrichChunkMetadata(chunk, index, options) {
  const metadata = {
    chunk_index: index,
    chunk_length: chunk.length,
    estimated_tokens: estimateTokens(chunk),
    has_code: /```[\s\S]*?```/.test(chunk),
    has_api_terms: /\b(api|endpoint|rest|graphql|webhook|oauth)\b/i.test(chunk),
    has_technical_terms:
      /\b(authentication|authorization|token|request|response)\b/i.test(chunk),
    has_shopify_terms: /\bshopify\b/i.test(chunk),
    sentence_count: (chunk.match(/[.!?]+/g) || []).length,
    word_count: (chunk.match(/\S+/g) || []).length,
  };

  // Extract key terms
  metadata.key_terms = extractKeyTerms(chunk);

  // Determine content type
  metadata.content_type = determineContentType(chunk);

  // Calculate readability score
  metadata.readability_score = calculateReadabilityScore(chunk);

  return metadata;
}

/**
 * Extract key terms from chunk
 */
function extractKeyTerms(chunk) {
  const terms = new Set();

  // Technical terms
  const techPatterns = [
    /\b(api|rest|graphql|webhook|oauth|jwt)\b/gi,
    /\b(create|update|delete|get|post|put|patch)\b/gi,
    /\b(product|order|customer|theme|app|shop)\b/gi,
    /\b(endpoint|url|request|response|header|body)\b/gi,
    /\b(authentication|authorization|token|key|secret)\b/gi,
  ];

  techPatterns.forEach((pattern) => {
    const matches = chunk.match(pattern);
    if (matches) {
      matches.forEach((match) => terms.add(match.toLowerCase()));
    }
  });

  return Array.from(terms);
}

/**
 * Determine content type
 */
function determineContentType(chunk) {
  if (/```[\s\S]*?```/.test(chunk)) {
    return "code_example";
  } else if (/\b(api|endpoint|rest|graphql)\b/i.test(chunk)) {
    return "api_documentation";
  } else if (/\b(how to|tutorial|guide|step)\b/i.test(chunk)) {
    return "tutorial";
  } else if (/\b(error|problem|issue|troubleshoot)\b/i.test(chunk)) {
    return "troubleshooting";
  } else if (/\b(what is|explain|definition)\b/i.test(chunk)) {
    return "explanation";
  } else {
    return "general";
  }
}

/**
 * Calculate readability score
 */
function calculateReadabilityScore(chunk) {
  const sentences = (chunk.match(/[.!?]+/g) || []).length;
  const words = (chunk.match(/\S+/g) || []).length;
  const syllables = chunk
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/[aeiouy]+/g, "a")
    .replace(/a/g, "").length;

  if (sentences === 0 || words === 0) return 0;

  // Simple readability formula
  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = syllables / words;

  const score =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  return Math.max(0, Math.min(100, score));
}

// Backward compatibility exports
export function splitTextIntoChunks(options) {
  return splitTextIntoEnhancedChunks(options);
}

export function splitRespectingCodeBlocks(text, opts = {}) {
  return splitTextIntoEnhancedChunks({
    text,
    ...opts,
    preserveCodeBlocks: true,
  });
}

export function enhanceChunkWithCodeBlocks(chunk, codeBlocks, opts = {}) {
  if (!codeBlocks || codeBlocks.length === 0) {
    return chunk;
  }

  const codeContext = codeBlocks
    .map(
      (cb) =>
        `\n\nCode Example:\n\`\`\`${cb.type || "javascript"}\n${
          cb.content
        }\n\`\`\``
    )
    .join("\n");

  const enhancedText = chunk + codeContext;
  const estimatedTokens = estimateTokens(enhancedText);
  const maxTokens = opts.chunkSizeTokens || 800;

  if (estimatedTokens <= maxTokens) {
    return enhancedText;
  } else {
    const limitedCodeBlocks = codeBlocks.slice(
      0,
      Math.min(2, codeBlocks.length)
    );
    const limitedContext = limitedCodeBlocks
      .map(
        (cb) =>
          `\n\nCode Example:\n\`\`\`${cb.type || "javascript"}\n${
            cb.content
          }\n\`\`\``
      )
      .join("\n");

    return chunk + limitedContext;
  }
}
