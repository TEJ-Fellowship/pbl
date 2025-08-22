import { PDFLoader } from "langchain/document_loaders/fs/pdf";

export class DocumentLoader {
  static async loadPDF(filePath) {
    try {
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();
      console.log(`✅ Loaded ${docs.length} pages from PDF`);
      return docs;
    } catch (error) {
      console.error("❌ Error loading PDF:", error.message);
      throw error;
    }
  }

  static async loadText(filePath) {
    try {
      const { TextLoader } = await import("langchain/document_loaders/fs/text");
      const loader = new TextLoader(filePath);
      const docs = await loader.load();
      console.log(`✅ Loaded text document: ${filePath}`);
      return docs;
    } catch (error) {
      console.error("❌ Error loading text document:", error.message);
      throw error;
    }
  }
}
