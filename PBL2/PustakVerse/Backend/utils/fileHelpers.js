const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const deleteFile = (filename) => {
  if (filename) {
    const filePath = path.join(__dirname, "..", "uploads", filename);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("Error deleting file:", err);
      }
    });
  }
};

const downloadImage = (url, filename) => {
  return new Promise((resolve, reject) => {
    const uploadsDir = path.join(__dirname, "..", "uploads");
    const file = fs.createWriteStream(path.join(uploadsDir, filename));
    const protocol = url.startsWith("https") ? https : http;

    const request = protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on("finish", () => {
        file.close();
        resolve(filename);
      });

      file.on("error", (err) => {
        fs.unlink(path.join(uploadsDir, filename), () => {});
        reject(err);
      });
    });

    request.on("error", (err) => {
      reject(err);
    });

    request.setTimeout(10000, () => {
      request.abort();
      reject(new Error("Download timeout"));
    });
  });
};

module.exports = { deleteFile, downloadImage };
