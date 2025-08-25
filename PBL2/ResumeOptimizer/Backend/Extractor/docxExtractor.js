import mammoth from "mammoth";

export async function extractDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (err) {
    console.error("DOCX extraction error:", err);
    return "";
  }
}