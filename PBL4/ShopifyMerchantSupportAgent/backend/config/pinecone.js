import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient = null;

export async function getPineconeClient() {
  if (pineconeClient) return pineconeClient;

  if (
    !process.env.PINECONE_API_KEY ||
    process.env.PINECONE_API_KEY === "your_pinecone_api_key_here"
  ) {
    throw new Error(
      "PINECONE_API_KEY is not configured - semantic search will be disabled"
    );
  }

  pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  return pineconeClient;
}

export async function getPineconeIndex() {
  const client = await getPineconeClient();
  const indexName =
    process.env.PINECONE_INDEX_NAME || "shopify-merchant-support";

  try {
    const index = client.index(indexName);
    return index;
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
      dimension: 768, // Dimension for Gemini embeddings
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
