import { GoogleGenAI } from "@google/genai";

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const apiKey = process.env.GEMINI_API_KEY;
console.log(apiKey);
const ai = new GoogleGenAI({ apiKey });

export const analyzeSentiment = async (message) => {
  const prompt = `
                    Input: "Just a quick note to say hi, Hope your day is as awesome as you are!",
                    Output: "cheerful"


                    Input: "Hoping to meet you soon, really missing you"
                    Output: "Longing"


                    give sentiment output for ${message}`;

  try {
    //   const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    //   const result = await model.generateContent(prompt);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    console.log(response.text);
    return response.text;
  } catch (error) {
    console.log("Gemini error:", error.message);
  }
};
