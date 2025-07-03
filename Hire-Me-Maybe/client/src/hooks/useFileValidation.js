import { useState } from "react";

export const useFileValidation = () => {
  const [fileErrors, setFileErrors] = useState([]);

  const validateFile = (file) => {
    const errors = [];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Check file type
    if (file.type !== "application/pdf") {
      errors.push("Only PDF files are allowed");
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push("File size must be less than 5MB");
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push("File cannot be empty");
    }

    // Check filename
    if (!file.name || file.name.trim() === "") {
      errors.push("Invalid filename");
    }

    // Check for suspicious extensions
    const suspiciousExtensions = [".exe", ".bat", ".cmd", ".com"];
    const hasSuspiciousExt = suspiciousExtensions.some((ext) =>
      file.name.toLowerCase().includes(ext)
    );

    if (hasSuspiciousExt) {
      errors.push("File type not allowed");
    }

    setFileErrors(errors);
    return errors;
  };

  const clearErrors = () => {
    setFileErrors([]);
  };

  return {
    validateFile,
    fileErrors,
    clearErrors,
  };
};
