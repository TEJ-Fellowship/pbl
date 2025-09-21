import fs from "fs";
import path from "path";
import mammoth from "mammoth";

/**
 * Extract text from PDF using pdf2json
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function extractPDFText(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF file not found: ${filePath}`);
  }

  console.log("Extracting PDF text using pdf2json...");

  const PDF2Json = (await import("pdf2json")).default;

  return new Promise((resolve, reject) => {
    const pdfParser = new PDF2Json();

    pdfParser.on("pdfParser_dataError", (err) => {
      console.error("PDF parsing error:", err.parserError);
      reject(new Error(`PDF parsing failed: ${err.parserError}`));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        let fullText = "";

        if (pdfData?.Pages) {
          pdfData.Pages.forEach((page) => {
            if (page.Texts) {
              const pageText = page.Texts.map((t) =>
                t.R?.map((r) => decodeURIComponent(r.T || "")).join(" ") || ""
              )
                .filter(Boolean)
                .join(" ");

              if (pageText.trim()) fullText += pageText + "\n";
            }
          });
        }

        resolve(fullText.trim() || "[PDF processed but no readable text found]");
      } catch (err) {
        reject(new Error(`Failed to process PDF data: ${err.message}`));
      }
    });

    try {
      pdfParser.loadPDF(filePath);
    } catch (err) {
      reject(new Error(`Failed to load PDF: ${err.message}`));
    }
  });
}

/**
 * Fallback basic PDF info if parsing fails
 */
async function extractPDFBasicInfo(filePath) {
  const stats = fs.statSync(filePath);
  const fileName = path.basename(filePath);
  const sizeKB = Math.round(stats.size / 1024);

  return `
PDF Document: ${fileName}
File Size: ${sizeKB} KB
Upload Date: ${new Date().toISOString()}
Status: PDF uploaded successfully - Text extraction in progress...
[Note: Full text extraction may require additional processing.]
  `.trim();
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractDOCXText(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`DOCX file not found: ${filePath}`);
  }

  console.log("Extracting DOCX text using mammoth...");
  const result = await mammoth.extractRawText({ path: filePath });

  return result.value?.trim() || "[DOCX processed but no readable text found]";
}

/**
 * Clean extracted text
 */
function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/\u2022/g, "•")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "--")
    .trim();
}

/**
 * Main extractor function
 * @param {Object} file - Multer file object
 */
export async function extractText(file) {
  if (!file?.path || !file?.originalname) {
    throw new Error("Invalid file object");
  }

  const fileExtension = path.extname(file.originalname).toLowerCase();
  let rawText = "";

  switch (fileExtension) {
    case ".pdf":
      try {
        rawText = await extractPDFText(file.path);
      } catch (err) {
        console.warn("PDF parsing failed, using basic info:", err.message);
        rawText = await extractPDFBasicInfo(file.path);
      }
      break;

    case ".docx":
      rawText = await extractDOCXText(file.path);
      break;

    case ".doc":
      throw new Error("DOC files not supported. Please use DOCX format.");

    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }

  return cleanText(rawText);
}

/**
 * Validate file type for uploads
 */
export function isValidFileType(file) {
  if (!file?.originalname || !file?.mimetype) return false;

  const ext = path.extname(file.originalname).toLowerCase();
  const validExts = [".pdf", ".docx"];
  const validMimes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  return validExts.includes(ext) && validMimes.includes(file.mimetype);
}
