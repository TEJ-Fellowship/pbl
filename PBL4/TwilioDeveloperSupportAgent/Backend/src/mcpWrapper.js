// Backend/src/mcpWrapper.js
// Lightweight MCP-style wrapper for Gemini (ES module)
// Purpose: build structured prompt from context blocks, add weights/prioritization.

const DEFAULT_MAX_BLOCKS = 8;

function blockToText(block) {
  // block: { id, type, title, content, metadata, weight }
  return `---BLOCK START---
TYPE: ${block.type}
TITLE: ${block.title || "untitled"}
METADATA: ${JSON.stringify(block.metadata || {})}
CONTENT:
${block.content}
---BLOCK END---`;
}

/**
 * Build a single prompt fragment from the top-weighted context blocks
 * @param {Array} blocks
 * @returns {string}
 */
export function buildContextPrompt(blocks = []) {
  // Sort by weight desc, then keep top K
  const sorted = blocks
    .slice()
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, DEFAULT_MAX_BLOCKS);

  // Join blocks into a single string prompt chunk
  return sorted.map(blockToText).join("\n\n");
}

/**
 * Generate response by composing a structured prompt and calling the provided geminiClient adapter.
 * The geminiClient is expected to have a `generate({ prompt, maxTokens })` method that returns { text }
 */
export async function generateResponse({
  geminiClient,
  query,
  contextBlocks = [],
  instructions = "",
  maxTokens = 1024,
}) {
  const contextPrompt = buildContextPrompt(contextBlocks);

  // Compose final prompt
  const prompt = [
    "You are an expert Twilio developer assistant. Use ONLY the context blocks below to answer.",
    "If the answer is not present in the context, respond concisely and ask for clarification or more info.",
    "Context Blocks (sorted top-first):",
    contextPrompt,
    "Additional Instructions:",
    instructions,
    "User Query:",
    query,
    "Answer:",
  ].join("\n\n");

  // Call existing Gemini function (assumes geminiClient.generate returns { text })
  const response = await geminiClient.generate({
    prompt,
    maxTokens,
  });

  // return whatever the adapter returned (keeps shape flexible)
  return response;
}

// default export for backward compatibility with `import mcp from "./mcpWrapper.js"`
export default {
  buildContextPrompt,
  generateResponse,
};
