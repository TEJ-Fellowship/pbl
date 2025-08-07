// src/utils/generateFinanceFact.js
import axios from "axios";

// NOTE: It is a best practice to store your API key in an environment variable, not hard-coded.
// For example, in a .env file: REACT_APP_GEMINI_API_KEY=YOUR_API_KEY
const apiKey = import.meta.env.VITE_GEMINI_API_KEY1;

export async function generateFinanceFact(category) {
  try {
    const prompt = `Give me a recent and interesting financial fact related to the "${category}" expense category. Keep it short and insightful.`;

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ]
        }
    );
    console.log(res)
    // The Gemini API response structure is different from OpenAI's
    const text = res.data.candidates[0].content.parts[0].text;
    return text.trim();

  } catch (error) {
    console.error("Error fetching finance fact from Gemini:", error.message);
    if (error.response) {
      // Log the specific error message from the API
      console.error("API Error:", error.response.data);
    }
    return "Couldn't generate a fact at this time.";
  }
}