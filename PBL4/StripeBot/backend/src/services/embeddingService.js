// undici provides fetch + related Web APIs for Node
const { fetch, Headers, Request, Response } = require("undici");
//Wraps an AI task into one simple call: tokenizes input, runs it through the model, and formats the output into usable results
const { pipeline } = require("@xenova/transformers"); 

/*
Polyfill for environments where fetch APIs are missing as @xenova/transformers (used by pipeline(...)) internally expects Web APIs like fetch, Headers, Request, and Response to exist globally.
This ensures the pipeline function can be used in Node.js environments that don't have these APIs natively.*/
if (typeof globalThis.fetch === "undefined") globalThis.fetch = fetch;
if (typeof globalThis.Headers === "undefined") globalThis.Headers = Headers;
if (typeof globalThis.Request === "undefined") globalThis.Request = Request;
if (typeof globalThis.Response === "undefined") globalThis.Response = Response;

// Keep these EXACTLY aligned with ingestion
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const TASK = "feature-extraction"; //number-extraction
const MAX_INPUT_CHARS = 8000;
const POOLING = "mean";
const NORMALIZE = true;

/** @type {import('@xenova/transformers').FeatureExtractionPipeline | null} */

let embedder = null;

/** @type {Promise<import('@xenova/transformers').FeatureExtractionPipeline> | null} */

let embedderPromise = null;

/* Ensures input is a string, handles null/undefined, and trims it to max allowed length */
function preprocessInput(input) {
  return String(input ?? "").slice(0, MAX_INPUT_CHARS);
}

async function getEmbedder() {
  if (embedder) return embedder;

  if (!embedderPromise) {
    /*This initializes the AI pipeline for a specific task "feature-extraction" using a pre-trained model "Xenova/all-MiniLM-L6-v2". 
    Returns a Promise that resolves once the model and tokenizer are loaded. 
    Returned value - pipeline object containing three main things bundled together:
    - The Callable Function: The object itself acts as a function. This is why in other code, you can do await model(text).
    - The Model: The actual neural network weights (the "brain" data).
    - The Tokenizer: The "dictionary" that knows how to turn your specific words into the specific ID numbers the model understands.
    */
    embedderPromise = pipeline(TASK, MODEL_ID)
      .then((instance) => {
        embedder = instance;
        return instance;
      })
      .catch((err) => {
        embedderPromise = null; // allow retry after transient failure
        throw err;
      });
  }
  return embedderPromise;
}

//takes raw human language and turns it into a mathematical coordinate (a vector) that a computer can compare, search, or categorize.
async function embedText(text) {
  const model = await getEmbedder();
  //Cleans the text (removing extra spaces, etc.) and uses the Tokenizer to chop the sentence into "tokens" (numbers) that the model can digest.
  const prepared = preprocessInput(text);

  const out = await model(prepared, {
    //A model might look at every single word individually. "Pooling" tells it how to combine all those word-meanings into one single "summary" for the whole sentence.
    pooling: POOLING,
    //This squishes the resulting numbers into a standard scale (usually between -1 and 1). This makes it much easier to compare two different sentences later on.
    normalize: NORMALIZE,
  });

  //outputs data in a "Tensor" format (which is like a high-performance math object). Most standard apps can't read Tensors easily, so Array.from converts that math object into a standard JavaScript List (Array) of numbers.
  return Array.from(out.data);
}

/* Iterates through an array of text, generating embeddings one by one.
Returns an array of all the vectors generated.*/
async function embedTexts(texts) {
  const vectors = [];
  for (const t of texts) {
    vectors.push(await embedText(t));
  }
  return vectors;
}

module.exports = {
  embedText,
  embedTexts,
  preprocessInput,
  constants: { MODEL_ID, TASK, MAX_INPUT_CHARS, POOLING, NORMALIZE },
};
