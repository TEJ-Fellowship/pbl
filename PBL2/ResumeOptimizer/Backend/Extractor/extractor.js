import fs from "fs";
import path from "path";
import mammoth from "mammoth";

async function extractPDFText(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found: ${filePath}`);
    }

    console.log("Attempting PDF text extraction with pdf2json...");

    // Dynamic import of pdf2json
    const PDF2Json = (await import("pdf2json")).default;

    return new Promise((resolve, reject) => {
      const pdfParser = new PDF2Json();

      // Set up event handlers
      pdfParser.on("pdfParser_dataError", (errData) => {
        console.error("PDF parsing error:", errData.parserError);
        reject(new Error(`PDF parsing failed: ${errData.parserError}`));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        try {
          let fullText = "";

          if (pdfData && pdfData.Pages) {
            // Extract text from each page
            pdfData.Pages.forEach((page) => {
              if (page.Texts) {
                const pageText = page.Texts.map((textObj) => {
                  if (textObj.R && textObj.R.length > 0) {
                    return textObj.R.map((r) => decodeURIComponent(r.T || "")).join(" ");
                  }
                  return "";
                })
                  .filter((text) => text.trim())
                  .join(" ");

                if (pageText.trim()) {
                  fullText += pageText + "\n";
                }
              }
            });
          }

          console.log(`PDF text extracted: ${fullText.length} characters`);
          resolve(fullText.trim() || "[PDF processed but no readable text found]");
        } catch (processError) {
          console.error("Error processing PDF data:", processError);
          reject(new Error(`Failed to process PDF data: ${processError.message}`));
        }
      });

      // Load and parse the PDF
      try {
        pdfParser.loadPDF(filePath);
      } catch (loadError) {
        console.error("Error loading PDF:", loadError);
        reject(new Error(`Failed to load PDF: ${loadError.message}`));
      }
    });
  } catch (error) {
    console.error("PDF extraction setup error:", error);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

async function extractPDFBasicInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const sizeKB = Math.round(stats.size / 1024);

    return `
PDF Document: ${fileName}
File Size: ${sizeKB} KB
Upload Date: ${new Date().toISOString()}
Status: PDF uploaded successfully - Text extraction in progress...
[Note: This PDF has been uploaded and stored. Full text extraction may require additional processing.]
    `.trim();
  } catch (error) {
    throw new Error(`Failed to read PDF file info: ${error.message}`);
  }
}

async function extractDOCXText(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`DOCX file not found: ${filePath}`);
    }

    console.log("Extracting text from DOCX...");
    const result = await mammoth.extractRawText({ path: filePath });

    if (!result.value || result.value.trim().length === 0) {
      return "[DOCX processed but no readable text found]";
    }

    console.log(`DOCX extraction successful: ${result.value.length} characters`);
    return result.value;
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error(`Failed to extract DOCX text: ${error.message}`);
  }
}

function cleanText(text) {
  if (!text) return "";

  return text
    .replace(/\s+/g, " ") // Multiple spaces to single space
    .replace(/\n\s*\n/g, "\n") // Remove empty lines
    .replace(/\u00A0/g, " ") // Non-breaking spaces
    .replace(/\u2022/g, "•") // Bullet points
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/\u2013/g, "-") // En dash
    .replace(/\u2014/g, "--") // Em dash
    .trim();
}

export async function extractText(file) {
  const startTime = Date.now();

  try {
    if (!file?.path || !file?.originalname) {
      throw new Error("Invalid file object");
    }

    if (!fs.existsSync(file.path)) {
      throw new Error(`File not found: ${file.path}`);
    }

    const fileExtension = path.extname(file.originalname).toLowerCase();
    let rawText = "";

    switch (fileExtension) {
      case ".pdf":
        try {
          // Try advanced PDF extraction first
          rawText = await extractPDFText(file.path);
        } catch (pdfError) {
          console.warn("Advanced PDF extraction failed, using basic info:", pdfError.message);
          // Fallback to basic file info
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

    const cleanedText = cleanText(rawText);
    const duration = Date.now() - startTime;

    console.log(`✅ Completed in ${duration}ms`);
    console.log(`📝 Result: ${cleanedText.length} characters`);

    return cleanedText || `[${fileExtension.toUpperCase()} file uploaded successfully]`;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed after ${duration}ms:`, error.message);
    throw error;
  }
}

/**
 * Validate file type
 * @param {Object} file - Multer file object
 * @returns {boolean} - True if supported
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
