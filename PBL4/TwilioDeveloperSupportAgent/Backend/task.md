# Task Split

| Module                           | Assigned To | Why                                                                                 |
| -------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| 🕸️ Web Scraping                  | **Manoj**   | Mostly data wrangling — good warm-up; uses `axios + cheerio`                        |
| ✂️ Chunking Logic                | **Swikar**  | Needs logical thinking to preserve code blocks, perfect for your full-stack mindset |
| 🧠 Embeddings + Metadata Tagging | **Swikar**  | Core AI logic; you’ll handle OpenAI API + tagging                                   |
| 🧱 Qdrant Setup + Data Insert    | **Manoj**   | Once you give them embeddings, they push it into DB — uses REST API or `qdrant-js`  |
| 🔍 Query + Search Pipeline       | **Swikar**  | Connects everything together — this is the RAG brain                                |
| 💬 Terminal Chat UI              | **Manoj**   | Fun, user-facing part — using `readline-sync` and `cli-highlight`                   |
| 🌈 Syntax Highlighting & Testing | **Both**    | Final polish — test queries, color output, fix any formatting bugs                  |

# WorkFlow Summary

| Day       | Swikar                                                               | Manoj                                                              |
| --------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Day 1** | Create backend skeleton & `.env`, install deps, write `chunkDocs.js` | Build `scrapeTwilioDocs.js` and scrape 3–4 key docs                |
| **Day 2** | Build embeddings generator & metadata tagging script                 | Set up Qdrant (local/docker), create collection, insert embeddings |
| **Day 3** | Build main `qa.js` query handler + test retrieval                    | Build CLI interface, add syntax highlighting, test queries         |

qdrant key

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.atItnuZ6E9UphHDahNZEfiJa6nRh8HkXM680EFyeIpQ

usaege: js

import {QdrantClient} from '@qdrant/js-client-rest';

const client = new QdrantClient({
url: 'https://86d634fa-1c6d-42d8-ad56-18163e84a6b4.europe-west3-0.gcp.cloud.qdrant.io:6333',
apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.atItnuZ6E9UphHDahNZEfiJa6nRh8HkXM680EFyeIpQ',
});

try {
const result = await client.getCollections();
console.log('List of collections:', result.collections);
} catch (err) {
console.error('Could not get collections:', err);
}
