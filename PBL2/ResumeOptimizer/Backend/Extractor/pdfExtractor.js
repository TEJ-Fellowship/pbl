import { readFileSync } from 'fs';
import PDFParser from 'pdf2json';

export async function extractPdf(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      const text = pdfParser.getRawTextContent();
      resolve(text);
    });

    pdfParser.on("pdfParser_dataError", (error) => {
      console.error("PDF extraction error:", error);
      reject(error);
    });

    pdfParser.parseBuffer(buffer);
  });
}