// System prompt for rewriting user input into a concise, standalone question
// TODO(#891): Conversation-history-aware will be added in a follow-up PR;
const REWRITE_SYSTEM_PROMPT = `Transform the user's message into a concise, standalone question optimized for vector search retrieval.

Rules:
- Remove greetings, filler words, hedges ("I was wondering", "can you help me"), and first-person pronouns.
- Resolve all conversational references (e.g., "it", "that", "the previous one") using context from the conversation history.
- Output exactly one grammatically correct, self-contained question.
- Preserve domain-specific terminology and named entities exactly as written.
- If the input is already a clean question, return it unchanged.
- If the intent is ambiguous, lean toward the broader interpretation.

Output: A single plain string. No explanation, no alternatives, no punctuation beyond the question mark.`;

const REWRITE_FALLBACK_WARN_MESSAGE =
  "Rewrite failed, falling back to original userPrompt";

module.exports = {
  REWRITE_SYSTEM_PROMPT,
  REWRITE_FALLBACK_WARN_MESSAGE,
};
