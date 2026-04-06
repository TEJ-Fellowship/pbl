const { chunkTextByTokens } = require("./chunker");
const { countTokens } = require("./tokenCounter");

const text = `
Stripe supports cards, wallets, and bank debits.
You can create payment intents and confirm them on client or server.
Webhooks notify your backend for async payment updates.
Refunds, disputes, and subscriptions are supported as well.
`.repeat(20); // make it longer

const config = {
  maxChunkTokens: 80,
  overlapTokens: 10,
};

const chunks = chunkTextByTokens(text, config);

console.log("Total chunks:", chunks.length);

chunks.forEach((c, i) => {
  const tokens = countTokens(c);
  console.log(`Chunk ${i + 1} token count:`, tokens);
});
