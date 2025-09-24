import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export class TextSplitter {
  constructor(options = {}) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: options.chunkSize || 1000,
      chunkOverlap: options.chunkOverlap || 200,
    });
  }

  //Split documents into chunks
  async splitDocuments(documents) {
    const allChunks = [];
    for (const document of documents) {
      const chunks = await this.splitter.splitDocuments([document]);
      allChunks.push(...chunks);
    }
    return allChunks;
  }
}
