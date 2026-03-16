const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ ERROR: GEMINI_API_KEY is missing from your .env file!");
  process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey });

/**
 * Returns a model-like object compatible with controller usage:
 *   const model = getModel("gemini-2.0-flash");
 *   const result = await model.generateContent(prompt);
 *   const text = result?.response?.text ?? "";
 * @param {string} modelName 
 */
function getModel(modelName = "gemini-3-flash-preview") {
  return {
    async generateContent(prompt) {
      try {
        const response = await genAI.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        if (!response) {
          throw new Error("Gemini returned no response");
        }
        return {
          response: {
            text: response.text ?? "",
          },
        };
      } catch (error) {
        const message = error?.message ?? "Failed to generate content";
        throw new Error(`Gemini error: ${message}`);
      }
    },
  };
}

async function generateText(prompt, modelName){
  const model = getModel(modelName);
  const result = await model.generateContent(prompt);
  return result?.response?.text ?? "";
}

module.exports = { getModel, genAI, generateText };
