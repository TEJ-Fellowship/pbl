# StripeBot Backend — Project documentation

This document explains **what this service is**, **why it matters**, and how reviewers and new teammates should think about it. Operational steps live in **[README.md](./README.md)**.

---

## What this project is

**StripeBot backend** is a small **retrieval layer** for a Stripe-focused assistant:

1. **Collects** public Stripe documentation text from a **curated list of URLs** (`scraper.js`).
2. **Chunks** each page with **token-aware** splitting and overlap (`utils/chunker.js` + `tokenCounter.js`), driven from **`ingestVector.js`** (no separate required “chunk-only” script in the default flow).
3. **Embeds** chunks locally with **`Xenova/all-MiniLM-L6-v2`** (384 dimensions, mean pooling, L2-normalized in code) and stores rows in **Supabase Postgres** with **pgvector** and a **generated `tsvector`** column for full-text search.
4. **Retrieves** with **hybrid search**: PostgreSQL **FTS** + **cosine-style vector distance** (`<=>`), fused with **reciprocal rank fusion (RRF)** in `hybridRagService.js`.

The HTTP surface includes:

- **`GET /api/rag`** — lightweight DB connectivity check.
- **`POST /api/rag/search`** — hybrid retrieval for RAG or demos.
- **`POST /api/chat`** — optional Gemini-backed chat (`gemini.service.js`), separate from retrieval.

An LLM “answer” layer would typically sit **upstream** of or **after** retrieval, using `results[].content` and citations (`sourceUrl`, `title`, etc.) as context.

---

## Why it matters

| Concern              | How this backend helps                                              |
| -------------------- | ------------------------------------------------------------------- |
| Grounded answers     | Retrieval returns stored doc chunks, not model-only guessing.       |
| Exact phrases / IDs  | **FTS** fits error codes, API names, pasted strings.                |
| Paraphrases          | **Embeddings** help when wording differs from the docs.             |
| One datastore        | Postgres holds text, vectors, and FTS index together.             |
| Clear pipeline stages| Scrape → ingest → query maps to separate tasks and ownership.       |

---

## Scope (in / out)

**In scope**

- Seed URL scraping with rate limiting and HTML cleanup + **secret-like redaction** in `scraper.js`.
- Chunk-level storage and hybrid search API.
- Optional chat route using Google Gemini when configured.

**Out of scope (unless added later)**

- Full-site crawl or sitemap-driven discovery.
- Multi-tenant auth / row-level security modeling.
- JS-rendered-only pages (no Playwright in the default scraper).
- Production-grade ingest parallelism (current ingest is intentionally simple).

---

## Architectural principles

1. **Separation of concerns** — Scripts (`scraper`, `ingestVector`) vs HTTP (`app` + routes + controllers) vs domain services (`hybridRagService`, `embeddingService`).
2. **CommonJS** — `"type": "commonjs"`; use `require` / `module.exports` consistently.
3. **Schema matches embeddings** — `vector(384)` in SQL must match the embedding model; changing model dimension requires migration + **full re-ingest**.
4. **Hybrid retrieval** — RRF is a simple baseline so neither FTS nor vectors dominates by default.
5. **Errors** — Controllers prefer `next(err)` so `errorMiddleware` can format responses consistently (health may still attach `statusCode` for 503).

---

## Key dependencies

| Dependency               | Role                                  | Note                                              |
| ------------------------ | ------------------------------------- | ------------------------------------------------- |
| Supabase / Postgres      | Chunks, vectors, FTS                  | SSL; secrets in `.env` only.                      |
| `pg` + `pgvector`        | Typed vectors + `toSql` for queries   | Pool registers vector type on connect.            |
| `@xenova/transformers`   | Local embeddings                      | First run downloads weights.                      |
| `cheerio` + `undici`     | Scrape static HTML                    | Not a browser.                                    |
| `js-tiktoken`            | Token counts for chunking             | Model/encoding configurable via env in tokenCounter.|
| `express`                | HTTP API                              | Routes under `src/routes`, handlers in `controllers`. |
| `@google/generative-ai`  | Chat only                             | Requires `GEMINI_API_KEY` when using `/api/chat`. |

---

## Security and compliance

- Never commit `.env` or database URLs in docs/screenshots.
- Encode special characters in `DATABASE_URL` passwords.
- Respect Stripe’s terms and rate limits for non-demo use.
- Redaction in `scraper.js` reduces accidental key-like strings in stored text; it is **not** a guarantee—never log real secrets.

---

## Risks and trade-offs

| Risk              | Note                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| Thin URL coverage | Quality improves with more curated URLs or controlled crawling.      |
| Ingest duration   | Sequential embed + insert; scale may need batching/concurrency.      |
| Model change      | New embedding model ⇒ new dimension ⇒ migration + re-ingest.         |
| FTS language      | `english` config may be suboptimal for mixed-language content.       |
| SQL tooling       | Supabase “explain analyze” mode breaks DDL; use plain Run for setup. |

---

## Maintenance checklist

- [ ] `setup_hybrid.sql` applied to the database pointed to by `.env`.
- [ ] `npm run scrape` produces non-empty `data/stripe_docs/scraped.json`.
- [ ] `npm run ingest` completes without vector dimension / cast errors.
- [ ] `GET /api/rag` returns `{ ok: true, db: true, ... }` when DB is up.
- [ ] `POST /api/rag/search` returns sensible results on known queries (keyword + semantic legs).
- [ ] After scraper changes, spot-check chunk boundaries (paragraph newlines preserved in `cleanContent`).

---

## Handoff notes

- **Chunking:** Primary logic is `src/utils/chunker.js` (`chunkScrapedJSON`, `chunkPageObject`). Ingest calls it from `ingestVector.js`; keep the **metadata shape** (`source_id`, `chunk_index`, `url`, …) aligned with SQL columns.
- **Frontend / RAG client:** Call `POST /api/rag/search` with `{ query }`; use `results[].content` and citation fields in prompts.
- **Health monitoring:** Use `GET /api/rag` (or add a dedicated `/health` alias in `app.js` if your platform expects that path).

---

## Document map

| File                     | Audience                          |
| ------------------------ | --------------------------------- |
| [README.md](./README.md) | Run, integrate, troubleshoot      |
| **PROJECT.md** (this)    | Leads, reviewers, onboarding    |
