import pdf from "pdf-parse";
import fs from "fs";
import { Document } from "@langchain/core/documents";

export class PDFLoader {
  constructor(filePath) {
    this.filePath = filePath;
  }
  //Load a single PDF file and convert it to a Document
  async load() {
    // Step 1: Read the PDF file from disk as a buffer
    const dataBuffer = fs.readFileSync(this.filePath);
    // Step 2: Parse the PDF buffer to extract text content
    const data = await pdf(dataBuffer);
    // Step 3: Create a Document object with the text content and metadata
    return new Document({
      pageContent: data.text,
      metadata: {
        source: this.filePath,
        pages: data.numpages,
        createdAt: new Date().toISOString(),
      },
    });
  }

  //Load all PDFs from a directory and convert them to Document objects
  static async loadFromDirectory(directoryPath) {
    // Step 1: Read the directory and get all PDF files
    const files = fs
      .readdirSync(directoryPath)
      .filter((file) => file.endsWith(".pdf"));
    const documents = [];

    // Step 2: Load each PDF file and convert it to a Document object
    for (const file of files) {
      try {
        const loader = new PDFLoader(`${directoryPath}/${file}`);
        const document = await loader.load();
        documents.push(document);
      } catch (error) {
        console.error(`Failed to load ${file}:`, error.message);
      }
    }
    // Step 3: Return the array of Document objects
    return documents;
  }
}
