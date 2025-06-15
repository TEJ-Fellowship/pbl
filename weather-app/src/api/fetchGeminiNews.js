import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/config";

const fetchGeminiNews = async (cityName) => {
  try {
    const { GEMINI_API_KEY } = config;

    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not found");
    }

    // Initialize Gemini AI News
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // Create prompt for city news information
    const today = new Date().toISOString().split("T")[0]; // e.g., "2025-06-15"
    const prompt = `Provide the latest 6 relevant news articles for the city: "${cityName} as of ${today}".

Return the result in the following JSON format:

{
  "city": "${cityName}",
  "news": [
    {
      "title": "Headline of the article",
      "date": "YYYY-MM-DD",
      "description": "2-3 sentence summary of the article."
    },
    ...
  ]
}

Only include news directly related to the city. Ensure the output is valid JSON with exactly 6 news articles.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result?.response;
    const text = response.text();
    console.log("Gemini AI news Response:", text);

    try {
      // Try to parse JSON from the response
      let cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(cleanedText);
      } catch (parseError) {
        // Fallback: extract the first JSON object from the text
        const objectMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          try {
            parsed = JSON.parse(objectMatch[0]);
          } catch (innerError) {
            console.error("Error parsing extracted JSON object:", innerError);
            throw new Error("Failed to parse city news (invalid JSON object)");
          }
        } else {
          console.error("Error parsing AI response:", parseError);
          throw new Error("Failed to parse city news (no JSON object found)");
        }
      }

      if (!parsed.city || !Array.isArray(parsed.news)) {
        throw new Error("Response format is invalid or incomplete.");
      }

      return {
        success: true,
        data: parsed,
      };
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      throw new Error("Failed to parse city news");
    }
  } catch (error) {
    console.error("Error fetching city news:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch Gemini news",
    };
  }
};

export default fetchGeminiNews;
