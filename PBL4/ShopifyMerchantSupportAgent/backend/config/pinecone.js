import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient = null;
let cachedIndex = null; // OPTIMIZATION: Cache index reference to avoid repeated lookups

export async function getPineconeClient() {
  if (pineconeClient) return pineconeClient;

  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is required in environment variables");
  }

  pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  return pineconeClient;
}

export async function getPineconeIndex() {
  // OPTIMIZATION: Cache index reference to save 10-20ms per search
  if (cachedIndex) return cachedIndex;

  const client = await getPineconeClient();
  const indexName =
    process.env.PINECONE_INDEX_NAME || "shopify-merchant-support";

  try {
    cachedIndex = client.index(indexName);
    return cachedIndex;
  } catch (error) {
    console.error(`Error accessing Pinecone index "${indexName}":`, error);
    throw error;
  }
}

export async function createPineconeIndex() {
  const client = await getPineconeClient();
  const indexName =
    process.env.PINECONE_INDEX_NAME || "shopify-merchant-support";

  try {
    // Check if index already exists
    const existingIndexes = await client.listIndexes();
    const indexExists = existingIndexes.indexes?.some(
      (index) => index.name === indexName
    );

    if (indexExists) {
      console.log(`Index "${indexName}" already exists`);
      return client.index(indexName);
    }

    // Create new index
    console.log(`Creating Pinecone index "${indexName}"...`);
    await client.createIndex({
      name: indexName,
      dimension: 384, // Dimension for all-MiniLM-L6-v2 embeddings
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });

    console.log(`✅ Index "${indexName}" created successfully`);
    return client.index(indexName);
  } catch (error) {
    console.error(`Error creating Pinecone index "${indexName}":`, error);
    throw error;
  }
}
