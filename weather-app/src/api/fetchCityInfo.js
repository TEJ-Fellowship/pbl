import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/config";

const fetchCityInfo = async (cityName) => {
  try {
    const { GEMINI_API_KEY } = config;

    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not found");
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create prompt for city information
    const prompt = `Provide a single interesting fact about ${cityName} in 1-2 sentences. Make it concise and engaging. Format the response as JSON: {"city": "${cityName}", "information": "your fact here"}`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("AI Response:", text);

    try {
      // Parse JSON from the response
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());

      if (!parsed.city || !parsed.information) {
        throw new Error("Invalid response format");
      }

      return {
        success: true,
        data: parsed,
      };
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      throw new Error("Failed to parse city information");
    }
  } catch (error) {
    console.error("Error fetching city information:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch city information",
    };
  }
};

export default fetchCityInfo;
