/**
 * Validates uploaded files for resume upload
 * Checks file type, size, and other requirements
 */

const validateFile = (file) => {
  const errors = [];

  // Check if file exists
  if (!file) {
    errors.push("No file uploaded");
    return errors;
  }

  // Check file type
  const allowedMimeTypes = ["application/pdf"];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    errors.push("Only PDF files are allowed");
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    errors.push("File size must be less than 5MB");
  }

  // Check if file has content
  if (!file.buffer || file.buffer.length === 0) {
    errors.push("File is empty");
  }

  // Check filename
  if (!file.originalname || !file.originalname.toLowerCase().endsWith(".pdf")) {
    errors.push("File must have a .pdf extension");
  }

  return errors;
};

/**
 * Validates file before upload
 */
const validateFileBeforeUpload = (file) => {
  const errors = validateFile(file);

  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }

  return true;
};

/**
 * Sanitizes filename for security
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

/**
 * Gets file extension
 */
const getFileExtension = (filename) => {
  return filename.split(".").pop().toLowerCase();
};

/**
 * Checks if file is PDF
 */
const isPdfFile = (file) => {
  return (
    file.mimetype === "application/pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf")
  );
};

module.exports = {
  validateFile,
  validateFileBeforeUpload,
  sanitizeFilename,
  getFileExtension,
  isPdfFile,
};
