### Shopify Merchant Support Agent — Backend

A minimal backend for a Tier-1 RAG assistant that can scrape Shopify docs, build a lightweight local index, and answer questions via a CLI chat. The default `npm start` runs the chat experience.

## Prerequisites

- Node.js >= 18.17
- A Google AI Studio API key for Gemini

## Quick Start (just run npm start)

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` with your Gemini API key:

```bash
GEMINI_API_KEY=your_google_ai_studio_key
# Optional
GEMINI_MODEL=gemini-1.5-pro
EMBEDDINGS_PROVIDER=local   # or "openai" (requires OPENAI_API_KEY)
OPENAI_API_KEY=your_openai_key_if_using_openai_embeddings
```

3. (Optional but recommended on first run) Prepare data folders and fetch docs, then build the index:

```bash
npm run prepare
npm run scrape
npm run ingest
```

4. Start the CLI chat:

```bash
npm start
```

Type your question and press Enter. Type `exit` to quit.

## What the scripts do

- `npm run prepare`: Ensures `data/shopify_docs/` exists.
- `npm run scrape`: Uses Puppeteer to fetch a few key Shopify help sections to JSON in `data/shopify_docs/`.
- `npm run ingest`: Splits and embeds scraped content, saving a simple index to `data/shopify_index.json`.
- `npm start`: Runs the chat (`src/chat.js`).

## Environment variables

- `GEMINI_API_KEY` (required): Google AI Studio API key.
- `GEMINI_MODEL` (optional): Defaults to `gemini-1.5-pro`.
- `EMBEDDINGS_PROVIDER` (optional): `local` (default) or `openai`.
- `OPENAI_API_KEY` (required only if using `EMBEDDINGS_PROVIDER=openai`).
- `PORT` (optional, API server only): Defaults to `3000`.

## Optional: Run the HTTP API (Express)

There is a basic Express server in `server.js` with a route defined in `routes/route.js` and controller in `controllers/controller.js`.

Start it with:

```bash
node server.js
```

Then open `http://localhost:3000/` (or your custom `PORT`). Note that `npm start` does not start the HTTP server; it launches the CLI chat.

## Notes

- Scraping relies on Puppeteer. On some systems you may need additional system libraries or to allow Chromium download during `npm install`.
- If you skip `npm run scrape`/`ingest`, the chat will still run, but answers may be limited due to missing context.
