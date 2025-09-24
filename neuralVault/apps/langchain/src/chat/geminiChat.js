import { createGeminiModel } from "../config/gemini.js";
import { CHAT_PROMPTS } from "./promptTemplates.js";
import { DocumentRetriever } from "../retrieval/retriever.js";
import { ChatHistory } from "./chatHistory.js";

export class GeminiChat {
  constructor(vectorStoreManager) {
    this.model = createGeminiModel();
    this.retriever = new DocumentRetriever(vectorStoreManager);
    this.chatHistory = new ChatHistory();
  }

  async chat(message, options = {}) {
    const {
      useRetrieval = true,
      promptType = "CONTEXTUAL_QA",
      includeHistory = true,
      maxContextLength = 2000,
    } = options;

    console.log("💬 Processing chat message...");

    let response;
    let context = "";

    if (useRetrieval) {
      try {
        // Retrieve relevant documents with timeout
        console.log(`🔍 Searching for: "${message}"`);
        const relevantDocs = await this.retriever.retrieveRelevantDocuments(
          message
        );

        if (relevantDocs.length > 0) {
          // Create context from retrieved documents
          context = relevantDocs.map((doc) => doc.content).join("\n\n");

          // Truncate context if too long
          if (context.length > maxContextLength) {
            context = context.substring(0, maxContextLength) + "...";
          }
          console.log(`✅ Found ${relevantDocs.length} relevant documents`);
        } else {
          console.log("⚠️ No relevant documents found");
        }
      } catch (error) {
        console.log(`⚠️ Search failed: ${error.message}`);
        console.log("🔄 Continuing without retrieval...");
        // Continue without retrieval if search fails
      }
    }

    // Add chat history context if requested
    if (includeHistory) {
      const recentMessages = this.chatHistory.getRecentMessages(3);
      const historyContext = recentMessages
        .map((entry) => `User: ${entry.message}\nAI: ${entry.response}`)
        .join("\n\n");

      if (historyContext) {
        context = context
          ? `${context}\n\nPrevious conversation:\n${historyContext}`
          : historyContext;
      }
    }

    // Generate response with error handling
    try {
      if (context && useRetrieval) {
        const prompt = CHAT_PROMPTS[promptType]
          .replace("{context}", context)
          .replace("{question}", message);

        response = await this.model.invoke(prompt);
      } else {
        // Fallback to general response
        const prompt = CHAT_PROMPTS.GENERAL_QA.replace("{question}", message);

        response = await this.model.invoke(prompt);
      }

      const responseText = response.text || response;

      if (!responseText || responseText.trim().length === 0) {
        throw new Error("Empty response from model");
      }

      return responseText;
    } catch (error) {
      console.log(`⚠️ Model API failed: ${error.message}`);
      console.log("🔄 Using fallback response...");

      // Fallback response when API fails
      const fallbackResponse = this.generateFallbackResponse(message, context);
      return fallbackResponse;
    }
  }

  generateFallbackResponse(message, context = "") {
    // Simple fallback response when API fails
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("what is") || lowerMessage.includes("who is")) {
      if (context && context.length > 0) {
        return `Based on the available information, I found some relevant content that might help answer your question about "${message}". However, I'm currently experiencing technical difficulties with the AI service. The relevant information I found includes: ${context.substring(
          0,
          200
        )}...`;
      } else {
        return `I'm currently experiencing technical difficulties with the AI service and cannot provide a complete answer to "${message}". Please try again later or check if the documents have been properly ingested.`;
      }
    }

    if (lowerMessage.includes("tej") || lowerMessage.includes("binita")) {
      return `I cannot find specific information about "${message}" in the available documents. This could be because: 1) The documents haven't been properly ingested, 2) The information isn't present in the current document set, or 3) There are technical issues with the search system. Please try ingesting more documents or check the system status.`;
    }

    return `I'm currently experiencing technical difficulties and cannot provide a complete response to "${message}". Please try again later or check the system status.`;
  }

  async chatWithAnalysis(message, analysisType = "DOCUMENT_ANALYSIS") {
    return await this.chat(message, {
      useRetrieval: true,
      promptType: analysisType,
    });
  }

  async summarizeContent(content) {
    const prompt = CHAT_PROMPTS.SUMMARIZATION.replace("{context}", content);

    const response = await this.model.invoke(prompt);
    return response.text || response;
  }

  async compareContent(content1, content2, comparisonRequest) {
    const prompt = CHAT_PROMPTS.COMPARISON.replace("{context1}", content1)
      .replace("{context2}", content2)
      .replace("{question}", comparisonRequest);

    const response = await this.model.invoke(prompt);
    return response.text || response;
  }

  getChatHistory() {
    return this.chatHistory.getHistory();
  }

  getRecentMessages(count = 5) {
    return this.chatHistory.getRecentMessages(count);
  }

  clearChatHistory() {
    this.chatHistory.clearHistory();
  }

  exportChatHistory(format = "json") {
    return this.chatHistory.exportHistory(format);
  }

  getChatStats() {
    return this.chatHistory.getHistoryStats();
  }

  searchChatHistory(query) {
    return this.chatHistory.searchHistory(query);
  }
}
