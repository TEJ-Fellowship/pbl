import path from "path";
import { extractPdf } from "./pdfExtractor.js";
import { extractDocx } from "./docxExtractor.js";


async function extractText(file) {
  const ext = file.originalname ? path.extname(file.originalname).toLowerCase() : "";
  try {
    if (ext === ".pdf") return await extractPdf(file.buffer);
    if (ext === ".docx") return await extractDocx(file.buffer);
    console.warn("Unsupported file type:", ext);
    return "";
  } catch (err) {
    console.error("Extraction error:", err);
    return "";
  }
}
export { extractText };
