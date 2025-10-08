let localPipeline = null;

async function getLocalPipeline() {
  if (localPipeline) return localPipeline;
  const { pipeline } = await import("@xenova/transformers");
  localPipeline = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );
  return localPipeline;
}

export async function embedTexts(texts) {
  const provider = (process.env.EMBEDDINGS_PROVIDER || "local").toLowerCase();
  if (provider !== "local") {
    throw new Error(
      "Only local embeddings are configured. Set EMBEDDINGS_PROVIDER=local."
    );
  }
  const pipe = await getLocalPipeline();
  const outputs = [];
  for (const t of texts) {
    const res = await pipe(t, { normalize: true, pooling: "mean" });
    outputs.push(Array.from(res.data));
  }
  return outputs;
}

export async function embedSingle(text) {
  const [e] = await embedTexts([text]);
  return e;
}
