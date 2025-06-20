// tech-master-LA/frontend/api/generateNewQuiz.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/config";

const generateNewQuiz = async (topic) => {
  try {
    const { GEMINI_API_KEY } = config;

    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not found");
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // Create prompt for quiz generation
    const prompt = `Generate a quiz about ${topic} with exactly 5 questions. 
    Each question should have 4 options and one correct answer.
    Format the response as a JSON object with this exact structure:
    {
      "title": "${topic} Quiz",
      "topic": "${topic}",
      "questions": [
        {
          "question": "Question text here",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correct": "The exact text of the correct option"
        }
      ]
    }
    
    Requirements:
    - Generate exactly 5 questions
    - Each question must have exactly 4 options
    - The correct answer must exactly match one of the options
    - Questions should cover different aspects of ${topic}
    - Questions should vary in difficulty
    - Make questions engaging and practical
    - Ensure all JSON is properly formatted
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up the response text
    const cleanedText = text
      .replace(/```json\n?|\n?```/g, "") // Remove code blocks
      .replace(/\n/g, "") // Remove newlines
      .trim();

    // Parse JSON from the response
    const parsed = JSON.parse(cleanedText);

    // Validate the response structure
    if (!parsed.title || !parsed.topic || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid quiz format");
    }

    // Validate each question
    parsed.questions.forEach((q, index) => {
      if (!q.question || !Array.isArray(q.options) || !q.correct) {
        throw new Error(`Invalid question format at index ${index}`);
      }
      if (q.options.length !== 4) {
        throw new Error(`Question ${index + 1} must have exactly 4 options`);
      }
      if (!q.options.includes(q.correct)) {
        throw new Error(
          `Question ${index + 1}'s correct answer must match one of its options`
        );
      }
    });

    // Ensure exactly 10 questions
    if (parsed.questions.length !== 5) {
      throw new Error(
        `Quiz must have exactly 5 questions, got ${parsed.questions.length}`
      );
    }

    return parsed; // Return the parsed quiz object directly
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

export default generateNewQuiz;

// Example usage:
/*
const quiz = await generateNewQuiz("JavaScript");
if (quiz.success) {
  console.log("Generated Quiz:", quiz.data);
} else {
  console.error("Error:", quiz.error);
}
*/
