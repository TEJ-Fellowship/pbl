# StripeBot Backend — Project documentation

This document explains **what this service is**, **why it matters**, and how to think about it during design reviews, handoffs, and production hardening. It complements the operational **[README.md](./README.md)**.

---

## What this project is

**StripeBot backend** is a small **retrieval layer** for a Stripe-focused support or developer assistant:

1. It **collects** public Stripe documentation text (fixed seed URLs today).
2. It **chunks** that text for retrieval quality (pluggable chunking in `testChunk.js`).
3. It **embeds** chunks locally with a compact transformer model and **stores** them in **Supabase Postgres** with **pgvector**.
4. It **answers retrieval queries** with **hybrid search**: classic **full-text (keyword)** ranking plus **dense vector (semantic)** similarity, combined with **reciprocal rank fusion (RRF)** so neither signal dominates by default.

The HTTP API exposes **health** and **hybrid search**; a separate chat/LLM layer (if any) would sit **upstream** and use these chunks as **grounded context** (RAG).

---

## Why it matters

| Stakeholder concern | How this backend helps |
|---------------------|-------------------------|
| **Accurate answers** | Retrieval is grounded in scraped doc text, not model hallucination alone. |
| **Keyword-heavy queries** | Users often paste error codes, endpoint names, or exact phrases — **FTS** handles those well. |
| **Paraphrases / concepts** | **Embeddings** help when wording differs from the docs. |
| **Single datastore** | Supabase gives **one** managed Postgres: metadata, vectors, and keyword index — fewer moving parts than Postgres + separate vector SaaS for a class project or MVP. |
| **Team velocity** | Clear stages (scrape → chunk → ingest → query) map to separate tasks and ownership (e.g. colleague-owned chunking). |

---

## Scope (in / out)

**In scope today**

- Scrape a **curated list** of Stripe documentation entry pages.
- Persist **chunk-level** rows with **384-dimensional** embeddings aligned to `Xenova/all-MiniLM-L6-v2`.
- **Hybrid retrieval** API for downstream RAG or demos.

**Explicitly out of scope (unless added later)**

- **Full-site crawl** or sitemap-driven discovery (would increase coverage and ops burden).
- **LLM answer generation** in this repo (only retrieval is implemented here).
- **Auth / multi-tenant** isolation (not modeled in `stripe_doc_chunks` yet).
- **Playwright** rendering (only static HTML from `fetch` + Cheerio).

Document those gaps in planning so expectations stay aligned with stakeholders.

---

## Architectural principles

1. **Separation of concerns** — Scrape, chunk, embed, and serve are separate entrypoints; `npm run dev` does not silently re-ingest.
2. **Swappable chunking** — `src/scripts/testChunk.js` is the agreed extension point so chunking strategy can change without rewriting ingest.
3. **Schema matches model** — `vector(384)` and the embedding pipeline must stay in lockstep; changing model dimension requires a **migration** and **re-ingest**.
4. **Hybrid by default** — Keyword-only and vector-only both fail on different query types; RRF is a simple, explainable fusion baseline.

---

## Dependencies and responsibilities

| Dependency | Role | Operational note |
|------------|------|------------------|
| **Supabase (Postgres)** | System of record for chunks + vectors + FTS | Requires SSL; credentials are secrets. |
| **pg / pgvector** | Typed access to `vector` columns | `db.js` registers the vector type on pool connect. |
| **@xenova/transformers** | Local CPU embeddings | First run downloads weights; cold start is slow. |
| **cheerio + undici** | Scrape HTML without a browser | JS-rendered-only content will not appear. |
| **Express** | Thin API surface | Keep routes small; push logic into services. |

---

## Security and compliance

- **Never commit `.env`** — database URLs and passwords must stay out of git.
- **Rotate credentials** if they are exposed (chat, screenshots, CI logs).
- **Connection strings** with special characters (e.g. `@` in passwords) must be **URL-encoded** when using `DATABASE_URL`.
- **Scraping** must respect Stripe’s terms, rate limits, and robots rules for anything beyond class/demo use.
- Scraped text includes **redaction** patterns for key-like substrings in `scraper.js`; do not treat that as a substitute for **never logging real secrets**.

---

## Risks and trade-offs

| Risk | Mitigation / note |
|------|-------------------|
| **Thin coverage** | Only seed URLs are scraped; quality improves with more URLs or controlled crawling. |
| **Ingest time** | Sequential embedding is simple but slow at scale; batch or external embedding API later. |
| **Model drift** | Upgrading the embedding model invalidates old vectors without re-ingest. |
| **FTS language** | `english` config may miss optimal behavior for mixed-language content. |
| **Supabase limits** | Connection limits and disk apply; monitor index build times for HNSW. |

---

## Maintenance checklist (for reviewers)

- [ ] `setup_hybrid.sql` applied to the environment that `.env` points to.
- [ ] `npm run test:chunk` passes after scrape changes.
- [ ] Ingest completes without dimension / cast errors (384-d).
- [ ] `/health` returns OK against production-like DB.
- [ ] Sample `/api/rag/search` returns sensible mix of keyword + semantic hits on known queries.

---

## Handoff notes

- **Chunking owner**: replace logic inside `testChunk.js` while preserving exports used by `ingestVectors.js` (`chunkScrapedDocuments`, etc.) unless ingest is updated in the same change.
- **Frontend / chat**: consume `POST /api/rag/search` and pass `results[].content` (and citations from `sourceUrl` / `title`) into the LLM prompt.

---

## Document map

| File | Audience |
|------|----------|
| [README.md](./README.md) | Anyone running or integrating the backend |
| **PROJECT.md** (this file) | Tech leads, reviewers, new teammates |
