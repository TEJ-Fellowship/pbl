// Gemini AI Integration
// ----------------------------
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini only if API key is available
let genAI;
let geminiEnabled = false;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiEnabled = true;
    console.log("Gemini AI initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Gemini AI:", error);
  }
} else {
  console.warn("GEMINI_API_KEY not found. AI features will be disabled.");
}

// Function to generate book insights
async function generateBookInsights(bookData) {
  if (!geminiEnabled) {
    throw new Error("Gemini AI is not configured. Please check your API key.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using gemini-pro instead of gemini-2.5-flash

    const prompt = `
      Generate analytical insights about the following book. 
      Focus on key themes, the author's approach, and why someone might want to read it.
      DO NOT provide a detailed plot summary.
      
      Book: ${bookData.title} by ${bookData.author}
      ${
        bookData.description
          ? `Description: ${bookData.description}`
          : "No description available"
      }
      
      Please provide insights in this JSON format:
      {
        "keyThemes": ["theme1", "theme2", "theme3"],
        "authorsApproach": "brief description",
        "whyRead": "brief explanation",
        "readingExperience": "what to expect"
      }
    `;

    console.log("Sending prompt to Gemini for book:", bookData.title);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Raw response from Gemini:", text);

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        // Return a fallback response if parsing fails
        return {
          keyThemes: ["Literature", "Cultural themes", "Historical context"],
          authorsApproach:
            "The author employs a narrative style that explores complex themes",
          whyRead: "This book offers valuable insights into its subject matter",
          readingExperience:
            "Readers can expect an engaging and thought-provoking experience",
        };
      }
    }

    throw new Error("No JSON found in response");
  } catch (error) {
    console.error("Gemini API error details:", error);
    // Check if it's an API key error
    if (
      error.message.includes("API_KEY") ||
      error.message.includes("key") ||
      error.message.includes("quota")
    ) {
      throw new Error("Gemini API issue: " + error.message);
    }
    throw new Error("Failed to generate insights: " + error.message);
  }
}
module.exports = generateBookInsights;
