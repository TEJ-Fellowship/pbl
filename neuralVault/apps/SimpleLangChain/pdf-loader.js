import pdf from "pdf-parse";
import fs from "fs";
import { Document } from "@langchain/core/documents";

export class PDFLoader {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async load() {
    const dataBuffer = fs.readFileSync(this.filePath);
    const data = await pdf(dataBuffer);

    return new Document({
      pageContent: data.text,
      metadata: {
        source: this.filePath,
        pages: data.numpages,
        createdAt: new Date().toISOString(),
      },
    });
  }

  static async loadFromDirectory(directoryPath) {
    const files = fs
      .readdirSync(directoryPath)
      .filter((file) => file.endsWith(".pdf"));
    const documents = [];

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
