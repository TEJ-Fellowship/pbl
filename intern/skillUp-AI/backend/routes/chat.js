const express = require("express");
const router = express.Router();
require("dotenv").config();
const config = require("../utils/config");
const Chat = require("../models/chat");
const { GoogleGenAI } = require("@google/genai");

const apiKey = config.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

router.post("/chats", async (request, response, next) => {
  const topic = request.body.topic;
  const userRequest = request.body.userRequest;
  const user = request.body.user;

  const prompt = `
You are a highly experienced ${topic} expert with 10+ years of teaching experience. 
First, carefully understand what the user is asking (${userRequest}). If there is casual talk or a greeting, respond casually.
Then, provide an explanation that is clear, structured, and educational. 


OUTPUT FORMAT RULES:
- Return ONLY valid JSON (no extra text, no prose outside the JSON structure).
- Output MUST be an array with exactly 1 object.
- The object MUST strictly follow this schema:
  {
    "answer": "<Your answer to ${userRequest}. Structure the response into sections:
      Step-by-step, clear, beginner-friendly explanation.
      Relevant example with code blocks if applicable.
      Concise summary covering what, when, where, why, and how.>"
  }

VALIDATION RULES:
- Do not include any text outside the JSON array.
- The answer MUST directly address ${userRequest}.`;

  try {
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let cleanedResponse = aiResponse.text
      .replace(/```json\n?/g, "") // Remove ```json
      .replace(/```\n?/g, "") // Remove ```
      .trim(); // Remove extra whitespace

    const answer = JSON.parse(cleanedResponse);
    console.log("cleanedResponse", answer);

    const newChat = new Chat({
      userId: user.id,
      topic: topic,
      userRequest: userRequest,
      answer: answer[0].answer,
    });

    await newChat.save();

    return response.status(200).json({ data: answer });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
