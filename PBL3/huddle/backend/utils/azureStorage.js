import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();


const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "voice-notes";

if (!connectionString)
  throw new Error("Azure Storage connection string is missing");

// Create the BlobServiceClient object
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)

// Get a reference to a container
const containerClient = blobServiceClient.getContainerClient(containerName)

const uploadToAzure = async (fileBuffer, userId, fileType) => {
    try {
      // Generate unique blob name based on userId
      const blobName = `${userId}_${uuidv4()}.mp3`;

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Set blob HTTP headers for the content type
      const options = {
        blobHTTPHeaders: {
          blobContentType: "audio/mpeg",
        },
      };

      // Upload data to the blob
      await blockBlobClient.upload(fileBuffer, fileBuffer.length, options);

      return {
        fileUrl: blockBlobClient.url,
        blobName: blobName,
        fileSize: fileBuffer.length,
      };
    } catch (error) {
      console.error("Failed to upload file to Azure:", error);
      console.log("Falling back to local storage...");
    }
};

// Delete a blob from Azure Blob Storage
export const deleteFromAzure = async (blobName) => {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.delete();
      return true;
    } catch (error) {
      console.error("Failed to delete file from Azure:", error);
      console.log("Trying local storage instead...");
    }
};

export {uploadToAzure}