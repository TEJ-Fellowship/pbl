const { saveChatMessage } = require("../chat/chatHistory");

/**
 * Handle general knowledge queries (not PayPal-related)
 */
async function handleGeneralQuery(query, genAI, sessionId) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `You are a helpful AI assistant. The user asked a general knowledge question that is not related to PayPal.
Answer the question clearly and concisely in under 150 words.
You can optionally mention you're a PayPal support agent but are happy to help with general questions.`;

    const prompt = `${systemInstruction}

Question: ${query}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let answer = response.text().trim();

    // Ensure response is under 150 words
    const words = answer.split(" ");
    if (words.length > 150) {
      answer = words.slice(0, 150).join(" ") + "...";
    }

    // Save to chat history
    if (sessionId) {
      await saveChatMessage(sessionId, "user", query, {
        query_type: "general",
        issue_type: null,
      });
      await saveChatMessage(sessionId, "assistant", answer, {
        query_type: "general",
        issue_type: null,
      });
    }

    return {
      answer: answer,
      sentiment: { sentiment: "neutral", confidence: "low" },
      confidence: 100,
      citations: [],
      issueType: null,
      disclaimer: false,
      searchType: "general",
      query_type: "general",
    };
  } catch (error) {
    console.error("Error in handleGeneralQuery:", error);
    return {
      answer: "I apologize, but I encountered an error. Please try again.",
      sentiment: { sentiment: "neutral", confidence: "low" },
    };
  }
}

module.exports = { handleGeneralQuery };
