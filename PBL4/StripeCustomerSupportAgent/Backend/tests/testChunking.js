import { AdvancedChunker } from "../utils/advancedChunker.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Test the advanced chunking features
async function testAdvancedChunking() {
  console.log("🧪 Testing Advanced Chunking Features...");

  const advancedChunker = new AdvancedChunker();
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  // Sample document with code
  const sampleDoc = {
    pageContent: `
# Stripe Payment Intent API

To create a payment intent, use the following code:

\`\`\`javascript
const stripe = require('stripe')('sk_test_...');
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
});
\`\`\`

You can also use Python:

\`\`\`python
import stripe
stripe.api_key = "sk_test_..."

payment_intent = stripe.PaymentIntent.create(
    amount=2000,
    currency='usd',
)
\`\`\`

This creates a payment intent for $20.00 USD.
    `,
    metadata: {
      id: "test_doc_1",
      source: "https://stripe.com/docs/api/payment_intents/create",
      title: "Create Payment Intent",
      category: "payments",
      docType: "api",
    },
  };

  // Test chunking
  const chunks = await advancedChunker.createEnhancedChunks(
    sampleDoc,
    textSplitter
  );

  console.log(`\n📊 Results:`);
  console.log(`Total chunks: ${chunks.length}`);

  chunks.forEach((chunk, index) => {
    console.log(`\n--- Chunk ${index + 1} ---`);
    console.log(`Type: ${chunk.metadata.chunk_type}`);
    console.log(`Language: ${chunk.metadata.code_language || "N/A"}`);
    console.log(`Content preview: ${chunk.pageContent.substring(0, 100)}...`);
    console.log(`Metadata:`, {
      source_url: chunk.metadata.source_url,
      doc_type: chunk.metadata.doc_type,
      category: chunk.metadata.category,
      last_updated: chunk.metadata.last_updated,
      code_language: chunk.metadata.code_language,
    });
  });
}

// Run test
testAdvancedChunking().catch(console.error);
