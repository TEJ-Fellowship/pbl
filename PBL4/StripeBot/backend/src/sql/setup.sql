-- Legacy single-table shape. For hybrid RAG (chunks + FTS + vectors), use setup_hybrid.sql instead.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE stripe_docs (
  id          SERIAL PRIMARY KEY,
  source_url  TEXT,
  title       TEXT,
  content     TEXT,
  metadata    JSONB,
  embedding   vector(384)
);

CREATE INDEX ON stripe_docs 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
