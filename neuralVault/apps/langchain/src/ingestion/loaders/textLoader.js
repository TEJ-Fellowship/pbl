import { TextLoader } from "langchain/document_loaders/fs/text";

export class TextDocumentLoader {
  static async loadText(filePath) {
    try {
      const loader = new TextLoader(filePath);
      const docs = await loader.load();
      console.log(`✅ Loaded text document: ${filePath}`);
      return docs;
    } catch (error) {
      console.error("❌ Error loading text document:", error.message);
      throw error;
    }
  }

  static async loadMarkdown(filePath) {
    try {
      const { MarkdownTextSplitter } = await import("langchain/text_splitter");
      const loader = new TextLoader(filePath);
      const docs = await loader.load();
      console.log(`✅ Loaded markdown document: ${filePath}`);
      return docs;
    } catch (error) {
      console.error("❌ Error loading markdown document:", error.message);
      throw error;
    }
  }
}
