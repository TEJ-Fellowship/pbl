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
