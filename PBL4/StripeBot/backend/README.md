# StripeBot — Backend

Hybrid RAG backend: scrape Stripe docs → chunk → embed → **Supabase (Postgres + pgvector)** → keyword + semantic search with fusion.

For **why this exists**, scope, and trade-offs, see **[PROJECT.md](./PROJECT.md)**.

---

## Pipeline overview

```mermaid
flowchart LR
  subgraph collect
    A[Stripe doc URLs] --> B[scraper.js]
    B --> C[scraped.json]
  end
  subgraph prepare
    C --> D[testChunk.js]
    D --> E[Text chunks]
  end
  subgraph embed_store
    E --> F[embeddingService.js]
    F --> G[384-d vectors]
    G --> H[(Supabase Postgres)]
    H --> I[stripe_doc_chunks]
    I --> J[content_tsv / FTS]
    I --> K[embedding / HNSW]
  end
  subgraph query
    Q[User query] --> L[hybridRagService.js]
    L --> J
    L --> K
    L --> M[RRF fusion]
    M --> N[Ranked chunks]
  end
```

### Commands vs flow

```mermaid
flowchart TB
  subgraph npm
    scrape[npm run scrape]
    testchunk[npm run test:chunk]
    ingest[npm run ingest]
    refresh[npm run data:refresh]
    dev[npm run dev]
  end
  scrape --> JSON[data/stripe_docs/scraped.json]
  JSON --> testchunk
  JSON --> ingest
  scrape --> refresh
  refresh --> ingest
  ingest --> DB[(Supabase)]
  dev --> API[Express src/app.js]
  API --> hybrid[hybridRagService]
  hybrid --> DB
```

### Hybrid retrieval (keyword + semantic)

```mermaid
flowchart TB
  Q[Query text] --> E[Embed query]
  Q --> FTS[FTS: plainto_tsquery + ts_rank_cd]
  E --> VEC[Vector: cosine via embedding <=> query]
  FTS --> L1[Top-K keyword rows]
  VEC --> L2[Top-K semantic rows]
  L1 --> RRF[RRF merge]
  L2 --> RRF
  RRF --> OUT[Final ranked chunks]
```

---

## Quick start

1. **Install**

   ```bash
   cd PBL4/StripeBot/backend
   npm install
   ```

2. **Configure** — copy `.env.example` if you maintain one, or set:

   - `DATABASE_URL` *or* `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
   - Optional scrape tuning: `RATE_LIMIT_DELAY`, `SCRAPE_FETCH_TIMEOUT_MS`, `SCRAPE_USER_AGENT`

3. **Database** — in Supabase **SQL Editor**, run:

   [`src/sql/setup_hybrid.sql`](./src/sql/setup_hybrid.sql)

   This creates `stripe_doc_chunks` (vectors + generated `tsvector` + indexes).

4. **Scrape → ingest → run API**

   ```bash
   npm run scrape
   npm run test:chunk    # optional sanity check
   npm run ingest        # first run downloads the embedding model (slow)
   npm run dev
   ```

   Or one shot (scrape + ingest, not the server):

   ```bash
   npm run data:refresh
   ```

---

## NPM scripts

| Script | Purpose |
|--------|---------|
| `npm run scrape` | Fetch listed Stripe URLs → `data/stripe_docs/scraped.json` |
| `npm run test:chunk` | Read `scraped.json`, print chunk count (validates `testChunk.js`) |
| `npm run ingest` | Chunk → embed → upsert `stripe_doc_chunks` |
| `npm run data:refresh` | `scrape` then `ingest` |
| `npm run dev` | Express API (nodemon) |
| `npm start` | Express API (no watch) |

**Note:** `dev` does **not** auto-scrape or auto-ingest on boot (avoids accidental full re-runs).

---

## API

| Method | Path | Body / notes |
|--------|------|----------------|
| `GET` | `/health` | DB connectivity check |
| `POST` | `/api/rag/search` | `{ "query": "string", "keywordLimit"?, "semanticLimit"?, "finalLimit"? }` |

Example:

```bash
curl -s -X POST http://localhost:3000/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query":"webhook signature","finalLimit":5}'
```

Default port: `3000` (override with `PORT`).

---

## Key files

| Path | Role |
|------|------|
| `src/scripts/scraper.js` | HTTP fetch + Cheerio → `scraped.json` |
| `src/scripts/testChunk.js` | Chunking (swap-friendly for teammate) |
| `src/scripts/ingestVectors.js` | JSON → chunks → embeddings → DB |
| `src/services/embeddingService.js` | `Xenova/all-MiniLM-L6-v2` (384-d) |
| `src/services/hybridRagService.js` | FTS + vector search + RRF |
| `src/config/db.js` | `pg` pool + `pgvector` registration |
| `src/app.js` | Express entry |
| `src/sql/setup_hybrid.sql` | Schema for hybrid RAG |

Legacy: `src/sql/setup.sql` targets an older `stripe_docs` table; **hybrid flow uses `setup_hybrid.sql` only**.

---

## Ingest behavior

- Default: **truncates** `stripe_doc_chunks` before load. Set `INGEST_APPEND=1` to skip truncate (upsert only).
- Chunk size / overlap: `CHUNK_MAX_CHARS`, `CHUNK_OVERLAP` (see `testChunk.js`).

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `relation "stripe_doc_chunks" does not exist` | Run `setup_hybrid.sql` on the **same** DB as `.env`. |
| `Headers is not defined` (transformers) | Should be mitigated via undici polyfill in `embeddingService.js`; use Node 18+ if issues persist. |
| Empty keyword hits | Query terms are stopwords or not in indexed text; try different phrasing. |
| Scrape flags ignored with npm | Use `npm run scrape -- --sources=api --limit=1` (note `--` before script args). |

---

## Related doc

- **[PROJECT.md](./PROJECT.md)** — product context, importance, scope, risks, and maintenance notes.
