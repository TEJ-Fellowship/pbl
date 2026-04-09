const { embedText, constants } = require("../services/embeddingService");

async function testEmbeddingConnection() {
  const sample = "Embedding connectivity test from StripeBot backend.";
  const vector = await embedText(sample);

  console.log("Embedding model:", constants.MODEL_ID);
  console.log("Vector length:", vector.length);
  console.log("First 8 values:", vector.slice(0, 8));
}

(async () => {
  try {
    await testEmbeddingConnection();
    process.exit(0);
  } catch (error) {
    console.error("Embedding test failed:", error);
    process.exit(1);
  }
})();
