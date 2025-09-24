import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export class TextSplitter {
  constructor(options = {}) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: options.chunkSize || 1000, //Default chunk size is 1000 characters ( good for long context)
      chunkOverlap: options.chunkOverlap || 200, //Default chunk overlap is 200 characters
    });
  }

  //Split documents into chunks
  async splitDocuments(documents) {
    const allChunks = []; // Array to store all chunks
    for (const document of documents) {
      const chunks = await this.splitter.splitDocuments([document]);
      allChunks.push(...chunks);
    }
    return allChunks;
  }
}
