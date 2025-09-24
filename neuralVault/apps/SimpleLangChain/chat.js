import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";

export class Chat {
  constructor(vectorStore, apiKey) {
    this.vectorStore = vectorStore;
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      modelName: "gemini-2.5-flash",
      temperature: 0.7,
    });
    //Create a prompt template for the chat
    this.promptTemplate = new PromptTemplate({
      template: `Answer based on the context:

        Context: {context}

        Question: {question}

        Answer:`,
      inputVariables: ["context", "question"],
    });
  }

  async ask(question, maxResults = 3) {
    //1.RETRIEVAL: Retrieve relevant chunks from vector store
    const relevantDocs = await this.vectorStore.search(question, maxResults);

    if (relevantDocs.length === 0) {
      return "No relevant information found.";
    }

    //2.AUGMENTATION: Format retrieved chunks as context
    const context = relevantDocs
      .map((doc, index) => `[${index + 1}] ${doc.pageContent}`)
      .join("\n\n");

    //3.AUGMENTATION: Combine context with user question to create a prompt
    const prompt = await this.promptTemplate.format({
      context: context,
      question: question,
    });

    //4.GENERATION: Send prompt to Gemini and return response
    const response = await this.llm.invoke(prompt);
    return response.content;
  }
}
