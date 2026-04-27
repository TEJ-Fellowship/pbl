const { toSql } = require("pgvector");
const pool = require("../config/db");
const { embedText } = require("./embeddingService");
/** RRF_K (Reciprocal Rank Fusion): the number of results to return */
const RRF_K = 60;

/**
 * Reciprocal Rank Fusion over two ranked lists.
 * @param {{ id: number }[][]} lists
 * This function merges multiple ranked search results into a single scoring system using Reciprocal Rank Fusion.
 * lists: array of ranked results
 * k: the number of results to return
 * return: map of id to score
 * search: Text → embedding (384 numbers) → similarity search → list of results
 */
function reciprocalRankFusion(lists, k = RRF_K) {
  const scores = new Map();
  for (const list of lists) {
    list.forEach((row, rank) => {
      const id = row.id;
      /** 1 / (k + rank + 1): rank 1 → high score, rank 10 → low score */
      scores.set(id, (scores.get(id) || 0) + 1 / (k + rank + 1));
    });
  }
  return scores;
}

/**
 * Hybrid search: keyword (FTS-full text search) + semantic (cosine via pgvector), fused with RRF.
 * @param {string} query
 * @param {{ keywordLimit?: number, semanticLimit?: number, finalLimit?: number }} [opts]
 */
async function hybridSearch(query, opts = {}) {
  const keywordLimit = opts.keywordLimit ?? 15;
  const semanticLimit = opts.semanticLimit ?? 15;
  const finalLimit = opts.finalLimit ?? 8;
  const q = String(query || "").trim();
  if (!q) return { results: [], debug: { error: "empty query" } };

  /**
   * kwRows: results from the keyword search
   * queryVec: the embedding of the query
   * embedText: function to embed the query
   * Promise.all: to run the keyword search and the embedding search in parallel
   */
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

  /**
   * semRes: results from the semantic search
   * queryVec: the embedding of the query
   * $1::vector: your question’s embedding (queryVec) formatted for pgvector via toSql(queryVec)
   * embedding <=> $1 — cosine distance between each row’s embedding and the query vector (smaller distance = more similar)
   * ORDER BY embedding <=> $1::vector: sort the results by the cosine distance
   * (1 - (embedding <=> $1::vector)) AS sem_score: turns distance into a rough similarity-style score (higher = closer; exact scale depends on pgvector’s cosine distance definition).
   * LIMIT $2: limit the number of results to the semanticLimit
   * [toSql(queryVec), semanticLimit]: parameters for the query
   */
  const semRes = await pool.query(
    `SELECT id, source_url, title, content, chunk_index, source_doc_id,
    (1 - (embedding <=> $1::vector)) AS sem_score
FROM stripe_doc_chunks
WHERE embedding IS NOT NULL
ORDER BY embedding <=> $1::vector
LIMIT $2`,
    [toSql(queryVec), semanticLimit],
  );

  /**
   * merges two result sets and removes duplicates using id
   * - Keyword search results
   * - Semantic (vector) search results
   * Output = one combined dataset
   */
  const byId = new Map();
  for (const row of kwRows.rows) byId.set(row.id, { ...row });
  for (const row of semRes.rows) {
    if (!byId.has(row.id)) byId.set(row.id, { ...row });
    else Object.assign(byId.get(row.id), row);
  }
  /** It takes keyword + semantic search results, ranks them using RRF, sorts them, and returns the top document IDs.*/
  const rrfScores = reciprocalRankFusion([kwRows.rows, semRes.rows]);
  const mergedIds = [...rrfScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, finalLimit)
    .map(([id]) => id);

  /** It takes the top document IDs, maps them to their corresponding rows, and returns the full structured search results. */
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

module.exports = { hybridSearch };
