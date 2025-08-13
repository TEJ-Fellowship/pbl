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

export async function getNutritionBreakdown(ingredientsArray) {
  const prompt = `
    Based on my Ingredients give me the total nutritional breakdown of the food made from this recipie. Provide only the JSON no other stuffs and summaries.
    Format the result as a JSON object like:
    {
      "Protein": "xxg",
      "Carbohydrates": "xxg",
      "Fats": "xxg",
      "Water":"xxg",
      "Calories": "xxx kcal"
    }

    Ingredients:
    ${ingredientsArray.join(", ")}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text;
    let cleanedResponse = text
        .replace(/```json\n?/g, "") // Remove ```json
        .replace(/```\n?/g, "") // Remove ```
        .trim();
    console.log(JSON.parse(cleanedResponse));
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("❌ Error from Gemini:", error);
    throw new Error("Gemini API call failed");
  }
}