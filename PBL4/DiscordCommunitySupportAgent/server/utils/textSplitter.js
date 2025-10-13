import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create text splitter with 700 token chunks
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 700,
  chunkOverlap: 50,
  separators: ["\n\n", "\n", ". ", "! ", "? ", " ", ""],
});

export async function splitDocuments() {
  const rawDir = path.join(__dirname, "../data/raw");
  const chunksDir = path.join(__dirname, "../data/chunks");
  
  // Create chunks directory if it doesn't exist
  if (!fs.existsSync(chunksDir)) {
    fs.mkdirSync(chunksDir, { recursive: true });
  }

  const files = fs.readdirSync(rawDir);
  const allChunks = [];

  console.log("📄 Splitting documents into chunks...");

  for (const file of files) {
    if (file.endsWith('.txt')) {
      const filePath = path.join(rawDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Split the document
      const chunks = await textSplitter.splitText(content);
      
      // Save chunks to individual files
      const baseName = path.basename(file, '.txt');
      chunks.forEach((chunk, index) => {
        const chunkFileName = `${baseName}_chunk_${index + 1}.txt`;
        const chunkPath = path.join(chunksDir, chunkFileName);
        fs.writeFileSync(chunkPath, chunk);
        
        // Store chunk metadata
        allChunks.push({
          id: `${baseName}_${index + 1}`,
          content: chunk,
          source: file,
          chunkIndex: index + 1,
          fileName: chunkFileName
        });
      });
      
      console.log(`✅ Split ${file} into ${chunks.length} chunks`);
    }
  }

  // Save metadata
  const metadataPath = path.join(chunksDir, "metadata.json");
  fs.writeFileSync(metadataPath, JSON.stringify(allChunks, null, 2));
  
  console.log(`🎉 Total chunks created: ${allChunks.length}`);
  console.log(`📁 Chunks saved to: ${chunksDir}`);
  
  return allChunks;
}

export { textSplitter };
