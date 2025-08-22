import { DocumentLoader } from "../loaders/pdfLoader.js";
import { TextSplitter } from "../splitters/textSplitter.js";

export class DocumentProcessor {
  constructor(options = {}) {
    this.splitter = new TextSplitter(options);
  }

  async processPDF(filePath, options = {}) {
    console.log("🔄 Processing PDF document...");

    // 1. Load document
    const docs = await DocumentLoader.loadPDF(filePath);

    // 2. Split into chunks
    const splitDocs = await this.splitter.splitDocuments(docs);

    // 3. Add metadata
    const processedDocs = splitDocs.map((doc, index) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        chunkIndex: index,
        source: filePath,
        fileType: "pdf",
        processedAt: new Date().toISOString(),
      },
    }));

    console.log("✅ Document processing completed");
    return processedDocs;
  }

  async processText(filePath, options = {}) {
    console.log("🔄 Processing text document...");

    // 1. Load document
    const docs = await DocumentLoader.loadText(filePath);

    // 2. Split into chunks
    const splitDocs = await this.splitter.splitDocuments(docs);

    // 3. Add metadata
    const processedDocs = splitDocs.map((doc, index) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        chunkIndex: index,
        source: filePath,
        fileType: "text",
        processedAt: new Date().toISOString(),
      },
    }));

    console.log("✅ Text document processing completed");
    return processedDocs;
  }

  async processMarkdown(filePath, options = {}) {
    console.log("🔄 Processing markdown document...");

    try {
      // 1. Load document
      const docs = await DocumentLoader.loadText(filePath);

      // 2. Split into chunks
      const splitDocs = await this.splitter.splitDocuments(docs);

      // 3. Add metadata
      const processedDocs = splitDocs.map((doc, index) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          chunkIndex: index,
          source: filePath,
          fileType: "markdown",
          processedAt: new Date().toISOString(),
        },
      }));

      console.log("✅ Markdown document processing completed");
      return processedDocs;
    } catch (error) {
      console.error("❌ Error processing markdown:", error.message);
      throw error;
    }
  }

  async processDocx(filePath, options = {}) {
    console.log("🔄 Processing DOCX document...");

    try {
      // Import DOCX loader dynamically
      const { DocxLoader } = await import("langchain/document_loaders/fs/docx");

      // 1. Load document
      const loader = new DocxLoader(filePath);
      const docs = await loader.load();

      // 2. Split into chunks
      const splitDocs = await this.splitter.splitDocuments(docs);

      // 3. Add metadata
      const processedDocs = splitDocs.map((doc, index) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          chunkIndex: index,
          source: filePath,
          fileType: "docx",
          processedAt: new Date().toISOString(),
        },
      }));

      console.log("✅ DOCX document processing completed");
      return processedDocs;
    } catch (error) {
      console.error("❌ Error processing DOCX:", error.message);
      throw error;
    }
  }

  async processJson(filePath, options = {}) {
    console.log("🔄 Processing JSON document...");

    try {
      // Import JSON loader dynamically
      const { JSONLoader } = await import("langchain/document_loaders/fs/json");

      // 1. Load document
      const loader = new JSONLoader(filePath);
      const docs = await loader.load();

      // 2. Split into chunks
      const splitDocs = await this.splitter.splitDocuments(docs);

      // 3. Add metadata
      const processedDocs = splitDocs.map((doc, index) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          chunkIndex: index,
          source: filePath,
          fileType: "json",
          processedAt: new Date().toISOString(),
        },
      }));

      console.log("✅ JSON document processing completed");
      return processedDocs;
    } catch (error) {
      console.error("❌ Error processing JSON:", error.message);
      throw error;
    }
  }

  async processCsv(filePath, options = {}) {
    console.log("🔄 Processing CSV document...");

    try {
      // Import CSV loader dynamically
      const { CSVLoader } = await import("langchain/document_loaders/fs/csv");

      // 1. Load document
      const loader = new CSVLoader(filePath);
      const docs = await loader.load();

      // 2. Split into chunks
      const splitDocs = await this.splitter.splitDocuments(docs);

      // 3. Add metadata
      const processedDocs = splitDocs.map((doc, index) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          chunkIndex: index,
          source: filePath,
          fileType: "csv",
          processedAt: new Date().toISOString(),
        },
      }));

      console.log("✅ CSV document processing completed");
      return processedDocs;
    } catch (error) {
      console.error("❌ Error processing CSV:", error.message);
      throw error;
    }
  }

  async processXlsx(filePath, options = {}) {
    console.log("🔄 Processing Excel document...");

    try {
      // Import XLSX library
      const XLSX = (await import("xlsx")).default;
      const fs = await import("fs");

      // 1. Read the Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetNames = workbook.SheetNames;

      let allSheetData = [];

      // Process all sheets in the workbook
      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Use array of arrays format
          defval: "", // Default value for empty cells
        });

        // Convert rows to text format
        const sheetText = jsonData
          .filter((row) => row.some((cell) => cell !== "")) // Filter out empty rows
          .map((row) => row.join("\t")) // Join with tabs
          .join("\n");

        if (sheetText.trim()) {
          allSheetData.push({
            pageContent: `Sheet: ${sheetName}\n${sheetText}`,
            metadata: {
              source: filePath,
              sheet: sheetName,
              rows: jsonData.length,
            },
          });
        }
      }

      if (allSheetData.length === 0) {
        throw new Error("No data found in Excel file");
      }

      // 2. Split into chunks
      const splitDocs = await this.splitter.splitDocuments(allSheetData);

      // 3. Add metadata
      const processedDocs = splitDocs.map((doc, index) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          chunkIndex: index,
          source: filePath,
          fileType: "xlsx",
          processedAt: new Date().toISOString(),
        },
      }));

      console.log(
        `✅ Excel document processing completed (${sheetNames.length} sheets)`
      );
      return processedDocs;
    } catch (error) {
      console.error("❌ Error processing Excel:", error.message);
      throw error;
    }
  }
}
