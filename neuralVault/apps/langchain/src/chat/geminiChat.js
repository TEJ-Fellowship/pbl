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
      // Retrieve relevant documents
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

    // Generate response
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

    // Store in chat history
    this.chatHistory.addMessage(message, responseText, {
      useRetrieval,
      promptType,
      contextLength: context.length,
      relevantDocsCount: context ? context.split("\n\n").length : 0,
    });

    console.log("✅ Chat response generated");
    return responseText;
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
