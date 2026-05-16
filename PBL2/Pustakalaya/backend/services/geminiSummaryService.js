const ApiError = require("../utils/ApiError");
const { getBooksByIdService } = require("./googleBooksService");

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

function cleanText(value = "", max = 4000) {
  return String(value).replace(/\s+/g, " ").trim().slice(0, max);
}

function buildPrompt({ title, authors, description, categories }) {
  return `
You are a helpful library assistant.
Write a concise summary for readers.

Rules:
- 120-180 words
- Neutral tone
- No spoilers if possible
- If description is missing, say "Summary unavailable from source metadata."

Book data:
Title: ${cleanText(title, 200)}
Authors: ${cleanText((authors || []).join(", "), 300)}
Categories: ${cleanText((categories || []).join(", "), 300)}
Description: ${cleanText(description, 3000)}
`.trim();
}

async function generateBookSummary({ id, googleApiKey, geminiApiKey }) {
  const { book } = await getBooksByIdService({ id, apikey: googleApiKey });

  const prompt = buildPrompt({
    title: book?.title,
    authors: book?.author ? [book.author] : [],
    categories: book?.genre ? [book.genre] : [],
    description: book?.description || "",
  });

  const res = await fetch(
    `${GEMINI_URL}?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 260 },
      }),
    },
  );

  if (!res.ok) {
    throw new ApiError(502, "Gemini summary generation failed");
  }

  const data = await res.json();
  const summary =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .join("\n")
      .trim() || "";

  if (!summary) throw new ApiError(502, "Empty summary from Gemini");

  return {
    summary,
    meta: { model: "gemini-1.5-flash", sourceBookId: id },
  };
}

module.exports = { generateBookSummary };
