import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function getIngredientAlternatives(ingredientsArray) {
  const prompt = `
    Suggest alternative ingredients for the following list.
    The alternative ingredients should be less than 50 words in 5 bullet points. In the format:
    "Original ingredients ==> New ingredients"

    Ingredients:
    ${ingredientsArray.join(", ")}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text;
    console.log(text);
    return text;
  } catch (error) {
    console.error("❌ Error from Gemini:", error);
    throw new Error("Gemini API call failed");
  }
}
