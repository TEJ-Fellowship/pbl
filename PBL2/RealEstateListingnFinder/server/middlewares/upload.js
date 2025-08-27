import multer from "multer";

const storage = multer.memoryStorage(); // store files in memory
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
});

export default upload;
