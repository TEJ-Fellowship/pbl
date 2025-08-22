import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { config } from "../../config/index.js";

export class TextSplitter {
  constructor(options = {}) {
    const langchainConfig = config.getLangChainConfig();
    this.chunkSize = options.chunkSize || langchainConfig.chunkSize;
    this.chunkOverlap = options.chunkOverlap || langchainConfig.chunkOverlap;
  }

  async splitDocuments(documents) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
    });

    const splitDocs = await splitter.splitDocuments(documents);
    console.log(`✅ Split documents into ${splitDocs.length} chunks`);
    return splitDocs;
  }
}
