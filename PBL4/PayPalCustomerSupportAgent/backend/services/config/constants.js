require("dotenv").config();

const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AGENT_NAME = process.env.AGENT_NAME || "ashok limbu";
const TOP_K = 3;

module.exports = {
  PINECONE_INDEX,
  PINECONE_NAMESPACE,
  GEMINI_API_KEY,
  AGENT_NAME,
  TOP_K,
};
