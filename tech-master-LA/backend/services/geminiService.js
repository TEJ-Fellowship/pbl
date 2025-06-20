// tech-master-LA/backend/services/geminiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GEMINI_API_KEY } = require("../config/keys");

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // TODO: change to the model you want to use
    });
  }

  async sendChatMessage(messageHistory, newMessage) {
    try {
      // Validate inputs
      if (!newMessage || typeof newMessage !== "string") {
        throw new Error("New message is required and must be a string");
      }

      console.log("Processing in Gemini service:", {
        historyLength: messageHistory?.length || 0,
        newMessage,
        messageHistory,
      });

      // Ensure messageHistory is an array
      const history = Array.isArray(messageHistory) ? messageHistory : [];

      // Format the message history for Gemini
      const formattedHistory = history.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      // Add the new message to the history
      formattedHistory.push({
        role: "user",
        parts: [{ text: newMessage }],
      });

      // Start chat with history
      const chat = this.model.startChat();

      // Send messages sequentially to build context
      let response;
      for (const msg of formattedHistory) {
        response = await chat.sendMessage(msg.parts[0].text);
      }

      const responseText = await response.response.text();

      return {
        success: true,
        data: responseText,
      };
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return {
        success: false,
        error: error.message || "Failed to get AI response",
        statusCode: 500,
      };
    }
  }

  async generateQuizFromContext(context) {
    try {
      const prompt = `Generate a quiz with 5 multiple choice questions based on the following conversation. 
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
      
      Conversation context:
      ${context}

      Remember: Return ONLY the JSON object, no markdown formatting or code blocks.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response.text();

      // Clean up the response
      let cleanedResponse = response
        .replace(/```json\n?/g, "") // Remove ```json
        .replace(/```\n?/g, "") // Remove ```
        .trim(); // Remove extra whitespace

      try {
        const quiz = JSON.parse(cleanedResponse);

        // Validate quiz structure
        if (!quiz.questions || !Array.isArray(quiz.questions)) {
          throw new Error("Invalid quiz format: missing questions array");
        }

        // Validate each question
        quiz.questions.forEach((q, index) => {
          if (
            !q.question ||
            !q.options ||
            !Array.isArray(q.options) ||
            !q.correctAnswer
          ) {
            throw new Error(`Invalid question format at index ${index}`);
          }
          if (q.options.length !== 4) {
            throw new Error(
              `Question ${index + 1} must have exactly 4 options`
            );
          }
          if (!q.options.includes(q.correctAnswer)) {
            throw new Error(
              `Question ${index + 1} correct answer must be one of the options`
            );
          }
        });

        return { success: true, quiz };
      } catch (parseError) {
        console.error("Quiz Parsing Error:", parseError);

        // If parsing fails, try to generate again with a more strict prompt
        const retryPrompt = `Generate a quiz with 5 multiple choice questions. 
        Return ONLY the following JSON structure, nothing else:
        {
          "questions": [
            {
              "question": "What is JavaScript?",
              "options": ["A programming language", "A markup language", "A database", "An operating system"],
              "correctAnswer": "A programming language"
            }
          ]
        }
        
        Based on: ${context}`;

        const retryResult = await this.model.generateContent(retryPrompt);
        const retryResponse = await retryResult.response.text();
        const cleanedRetryResponse = retryResponse
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        const retryQuiz = JSON.parse(cleanedRetryResponse);
        return { success: true, quiz: retryQuiz };
      }
    } catch (error) {
      console.error("Gemini Quiz Generation Error:", error);
      return {
        success: false,
        error: error.message || "Failed to generate quiz",
      };
    }
  }
}

module.exports = new GeminiService();
