const express = require("express");
const router = express.Router();
require("dotenv").config();
const config = require("../utils/config");
const Chat = require("../models/chat");
const { GoogleGenAI } = require("@google/genai");

const apiKey = config.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

router.get("/chats/:userId", async (request, response, next) => {
  const userId = request.params.userId;
  try {
    const userChats = await Chat.find({ user: userId }).sort({ _id: 1 });
    let lastAnswer = [];
    if (userChats.length > 0) {
      lastAnswer = [{ answer: userChats[userChats.length - 1].answer }];
    }

    response.status(200).json({
      data: lastAnswer, // array with the most recent answer
      chats: userChats, // full chat documents, not just IDs
    });
  } catch (error) {
    next(error);
  }
});

router.get("/quize/:userId", async (request, response, next) => {
  const userId = request.params.userId;
  try {
    const userChat = await Chat.find({ user: userId }).sort({ _id: 1 });
    const chatText = userChat.map((c) => c.answer).join("\n");
    console.log(chatText, " this is all chats of user");

    const prompt = `Generate a quiz with 5 multiple choice questions based on the following content: ${chatText}. 
      Return ONLY a valid JSON object with no additional text, markdown, or code blocks.
      The JSON must strictly follow this format:
      {
        "questions": [
          {
            "question": "string",
            "options": ["string", "string", "string", "string"],
            "correctAnswer": "string"
          }
        ]
      }

      Remember: Return ONLY the JSON object, no markdown formatting or code blocks.`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      generationConfig: {
        response_mime_type: "application/json",
      },
    });

    let cleanedResponse = aiResponse.text
      .replace(/```json\n?/g, "") // Remove ```json
      .replace(/```\n?/g, "") // Remove ```
      .trim(); // Remove extra whitespace

    try {
      const quize = JSON.parse(cleanedResponse);

      // Ensure always an array
      if (!quize.questions || !Array.isArray(quize.questions)) {
        throw new Error("Invalid quiz format: missing questions array");
      }
      // Validate each question
      quize.questions.forEach((q, index) => {
        if (
          !q.question ||
          !q.options ||
          !Array.isArray(q.options) ||
          !q.correctAnswer
        ) {
          throw new Error(`Invalid question format at index ${index}`);
        }
        if (q.options.length !== 4) {
          throw new Error(`Question ${index + 1} must have exactly 4 options`);
        }
        if (!q.options.includes(q.correctAnswer)) {
          throw new Error(
            `Question ${index + 1} correct answer must be one of the options`
          );
        }
      });
     console.log(quize, "this is response from ai for quize");
      response.status(200).json({ data: quize });
      
    } catch (err) {
      console.error("Failed to parse AI response:", err);
      response.status(500).json({ 
        error: "Failed to generate valid quiz", 
        details: err.message 
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
