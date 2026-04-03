-- Hybrid RAG: dense vectors (semantic) + PostgreSQL full-text (keyword).
-- Run once in Supabase SQL editor (or psql) against your project database.

CREATE EXTENSION IF NOT EXISTS vector;

-- Chunk-level storage (one row per text chunk; replaces single-row-per-doc for RAG quality)
CREATE TABLE IF NOT EXISTS stripe_doc_chunks (
  id BIGSERIAL PRIMARY KEY,
  source_doc_id TEXT NOT NULL,
  chunk_index INT NOT NULL,
  source_url TEXT,
  title TEXT,
  content TEXT NOT NULL,
  content_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED,
  embedding vector(384),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (source_doc_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS stripe_doc_chunks_content_tsv_idx
  ON stripe_doc_chunks USING GIN (content_tsv);

CREATE INDEX IF NOT EXISTS stripe_doc_chunks_embedding_hnsw_idx
  ON stripe_doc_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
