import { toSql } from "pgvector";
import pool from "../config/db.js";
import { embedText } from "./embeddingService.js";

const RRF_K = 60;

/**
 * Reciprocal Rank Fusion over two ranked lists.
 * @param {{ id: number }[][]} lists
 */
function reciprocalRankFusion(lists, k = RRF_K) {
  const scores = new Map();
  for (const list of lists) {
    list.forEach((row, rank) => {
      const id = row.id;
      scores.set(id, (scores.get(id) || 0) + 1 / (k + rank + 1));
    });
  }
  return scores;
}

/**
 * Hybrid search: keyword (FTS) + semantic (cosine via pgvector), fused with RRF.
 * @param {string} query
 * @param {{ keywordLimit?: number, semanticLimit?: number, finalLimit?: number }} [opts]
 */
export async function hybridSearch(query, opts = {}) {
  const keywordLimit = opts.keywordLimit ?? 15;
  const semanticLimit = opts.semanticLimit ?? 15;
  const finalLimit = opts.finalLimit ?? 8;

  const q = String(query || "").trim();
  if (!q) return { results: [], debug: { error: "empty query" } };

  const [kwRows, queryVec] = await Promise.all([
    pool.query(
      `SELECT id, source_url, title, content, chunk_index, source_doc_id,
              ts_rank_cd(content_tsv, plainto_tsquery('english', $1)) AS kw_rank
       FROM stripe_doc_chunks
       WHERE content_tsv @@ plainto_tsquery('english', $1)
       ORDER BY kw_rank DESC
       LIMIT $2`,
      [q, keywordLimit],
    ),
    embedText(q),
  ]);

  const semRes = await pool.query(
    `SELECT id, source_url, title, content, chunk_index, source_doc_id,
            (1 - (embedding <=> $1::vector)) AS sem_score
     FROM stripe_doc_chunks
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [toSql(queryVec), semanticLimit],
  );

  const byId = new Map();
  for (const row of kwRows.rows) byId.set(row.id, { ...row });
  for (const row of semRes.rows) {
    if (!byId.has(row.id)) byId.set(row.id, { ...row });
    else Object.assign(byId.get(row.id), row);
  }

  const rrfScores = reciprocalRankFusion([kwRows.rows, semRes.rows]);
  const mergedIds = [...rrfScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, finalLimit)
    .map(([id]) => id);

  const results = mergedIds.map((id) => {
    const row = byId.get(id);
    return {
      id,
      sourceUrl: row.source_url,
      title: row.title,
      content: row.content,
      chunkIndex: row.chunk_index,
      sourceDocId: row.source_doc_id,
      rrfScore: rrfScores.get(id),
      kwRank: row.kw_rank ?? null,
      semScore: row.sem_score ?? null,
    };
  });

  return {
    results,
    debug: {
      keywordHits: kwRows.rows.length,
      semanticHits: semRes.rows.length,
    },
  };
}
