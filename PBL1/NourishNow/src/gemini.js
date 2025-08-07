import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function getIngredientAlternatives(ingredientsArray) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
    Suggest alternative ingredients for the following list.
    Return them in the format: X => Y (Original => Suggested).

    Ingredients:
    ${ingredientsArray.join(", ")}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text;
  } catch (error) {
    console.error("❌ Error from Gemini:", error);
    throw new Error("Gemini API call failed");
  }
}