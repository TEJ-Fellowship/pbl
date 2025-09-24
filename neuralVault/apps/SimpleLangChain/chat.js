import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";

export class Chat {
  constructor(vectorStore, apiKey) {
    this.vectorStore = vectorStore;
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      modelName: "gemini-1.5-flash",
      temperature: 0.7,
    });

    this.promptTemplate = new PromptTemplate({
      template: `Answer based on the context:

        Context: {context}

        Question: {question}

        Answer:`,
      inputVariables: ["context", "question"],
    });
  }

  async ask(question, maxResults = 3) {
    const relevantDocs = await this.vectorStore.search(question, maxResults);

    if (relevantDocs.length === 0) {
      return "No relevant information found.";
    }

    const context = relevantDocs
      .map((doc, index) => `[${index + 1}] ${doc.pageContent}`)
      .join("\n\n");

    const prompt = await this.promptTemplate.format({
      context: context,
      question: question,
    });

    const response = await this.llm.invoke(prompt);
    return response.content;
  }
}
