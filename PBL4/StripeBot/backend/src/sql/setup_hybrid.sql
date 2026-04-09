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
-- Create index for full-text search (keyword search)
-- GIN-Generalized Inverted Index: a data structure that allows for fast full-text search
-- content_tsv: converts text into searchable tokens e.g."I love JavaScript"→ ['love', 'javascript']
CREATE INDEX IF NOT EXISTS stripe_doc_chunks_content_tsv_idx
  ON stripe_doc_chunks USING GIN (content_tsv);

-- Create index for vector search
-- HNSW-Hierarchical Navigable Small World Graph: a data structure that allows for fast vector search
-- Instead of comparing query vector with ALL vectors, HNSW builds a graph of similar vectors
-- embedding: the vector to search for
-- vector_cosine_ops: the cosine distance operation-similarity is calculated using cosine distance
-- m: number of connections per node, more = better accuracy, less = faster search
-- m = 16: 16 connections per node
-- ef_construction: controls build quality of index, higher = better accuracy but slower indexing, lower = faster build but less accurate
CREATE INDEX IF NOT EXISTS stripe_doc_chunks_embedding_hnsw_idx
  ON stripe_doc_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
