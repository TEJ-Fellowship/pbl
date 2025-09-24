import pdf from "pdf-parse";
import fs from "fs";
import { Document } from "@langchain/core/documents";

/**
 * Simple PDF Loader - Demonstrates basic document loading
 * This is the foundation of LangChain document processing
 */
export class PDFLoader {
  constructor(filePath) {
    this.filePath = filePath;
  }

  /**
   * Load and parse a PDF file
   * Returns a LangChain Document object
   */
  async load() {
    try {
      console.log(`📄 Loading PDF: ${this.filePath}`);

      // Read the PDF file
      const dataBuffer = fs.readFileSync(this.filePath);

      // Parse the PDF content
      const data = await pdf(dataBuffer);

      // Create a LangChain Document
      const document = new Document({
        pageContent: data.text,
        metadata: {
          source: this.filePath,
          totalPages: data.numpages,
          title: data.info?.Title || "Unknown",
          author: data.info?.Author || "Unknown",
          createdAt: new Date().toISOString(),
        },
      });

      console.log(
        `✅ PDF loaded successfully: ${data.numpages} pages, ${data.text.length} characters`
      );
      return document;
    } catch (error) {
      console.error(`❌ Error loading PDF ${this.filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Load multiple PDF files from a directory
   */
  static async loadFromDirectory(directoryPath) {
    const documents = [];
    const files = fs
      .readdirSync(directoryPath)
      .filter((file) => file.endsWith(".pdf"));

    console.log(`📁 Found ${files.length} PDF files in ${directoryPath}`);

    for (const file of files) {
      try {
        const loader = new PDFLoader(`${directoryPath}/${file}`);
        const document = await loader.load();
        documents.push(document);
      } catch (error) {
        console.error(`Failed to load ${file}:`, error.message);
      }
    }

    return documents;
  }
}
