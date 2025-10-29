const { resizeVector768to1024 } = require("../utils/vectorUtils");
const { TOP_K, PINECONE_NAMESPACE } = require("../config/constants");

/**
 * Perform hybrid search combining semantic (Pinecone) and lexical (PostgreSQL) search
 */
async function hybridSearch(query, embedder, pineconeIndex, dbClient) {
  console.log("🔍 Running hybrid search...");

  // 1. Semantic Search (Pinecone)
  console.log("📊 Semantic search (Pinecone)...");
  const output = await embedder(query, { pooling: "mean", normalize: true });
  const queryEmbedding = Array.from(output.data);

  // Resize to 1024 dimensions for Pinecone
  const queryEmbedding1024 = resizeVector768to1024(queryEmbedding);

  const semanticResults = await pineconeIndex
    .namespace(PINECONE_NAMESPACE)
    .query({
      vector: queryEmbedding1024,
      topK: TOP_K,
      includeMetadata: true,
    });

  // 2. Lexical Search (PostgreSQL BM25)
  console.log("📝 Lexical search (PostgreSQL BM25)...");
  const lexicalQuery = `
    SELECT 
      id, source_file, original_index, chunk_index, text,
      ts_rank(text_search_vector, plainto_tsquery($1)) as rank
    FROM chunks 
    WHERE text_search_vector @@ plainto_tsquery($1)
    ORDER BY rank DESC
    LIMIT $2
  `;

  const lexicalResults = await dbClient.query(lexicalQuery, [query, TOP_K]);

  // 3. Combine and score results
  console.log("🔄 Combining results...");
  const combinedResults = combineSearchResults(
    semanticResults.matches,
    lexicalResults.rows
  );

  return combinedResults;
}

/**
 * Combine semantic and lexical search results with scoring
 */
function combineSearchResults(semanticResults, lexicalResults) {
  const combined = new Map();

  // Add semantic results (weight: 0.7)
  semanticResults.forEach((result) => {
    const id = result.id;
    combined.set(id, {
      ...result,
      semanticScore: result.score,
      lexicalScore: 0,
      combinedScore: result.score * 0.7,
      source: "semantic",
    });
  });

  // Add lexical results (weight: 0.3)
  lexicalResults.forEach((result) => {
    const id = `${result.source_file}:${result.original_index}:${result.chunk_index}`;
    const lexicalScore = result.rank;

    if (combined.has(id)) {
      // Update existing result
      const existing = combined.get(id);
      existing.lexicalScore = lexicalScore;
      existing.combinedScore =
        existing.semanticScore * 0.7 + lexicalScore * 0.3;
      existing.source = "hybrid";
    } else {
      // Add new result
      combined.set(id, {
        id,
        score: lexicalScore,
        semanticScore: 0,
        lexicalScore: lexicalScore,
        combinedScore: lexicalScore * 0.3,
        metadata: {
          source: result.source_file,
          original_index: result.original_index,
          chunk_index: result.chunk_index,
          text: result.text,
          preview: result.text.slice(0, 200) + "...",
        },
        source: "lexical",
      });
    }
  });

  // Sort by combined score and return top results
  return Array.from(combined.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, TOP_K);
}

module.exports = { hybridSearch, combineSearchResults };
