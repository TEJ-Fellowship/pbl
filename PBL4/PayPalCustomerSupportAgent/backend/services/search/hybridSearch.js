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

  // Detect fee query for more flexible search
  const isFeeQuery =
    /fee|fees|charge|charges|pricing|cost|rate|donation|donate/i.test(query);

  let lexicalQuery;
  if (isFeeQuery) {
    // For fee queries, use a more permissive search that includes ILIKE fallback
    lexicalQuery = `
      SELECT 
        id, source_file, original_index, chunk_index, text,
        COALESCE(ts_rank(text_search_vector, plainto_tsquery($1)), 0) as rank
      FROM chunks 
      WHERE text_search_vector @@ plainto_tsquery($1)
         OR text ILIKE '%' || $1 || '%'
      ORDER BY 
        CASE WHEN text_search_vector @@ plainto_tsquery($1) THEN 1 ELSE 2 END,
        rank DESC NULLS LAST,
        CASE WHEN source_file LIKE '%consumer_fees%' THEN 0 ELSE 1 END
      LIMIT $2
    `;
  } else {
    // Original query for non-fee queries
    lexicalQuery = `
      SELECT 
        id, source_file, original_index, chunk_index, text,
        ts_rank(text_search_vector, plainto_tsquery($1)) as rank
      FROM chunks 
      WHERE text_search_vector @@ plainto_tsquery($1)
      ORDER BY rank DESC
      LIMIT $2
    `;
  }

  let lexicalResults = await dbClient.query(lexicalQuery, [query, TOP_K * 2]); // Get more results initially

  // For fee queries, explicitly fetch consumer fee chunks if not already present
  if (isFeeQuery) {
    const hasConsumerFees = lexicalResults.rows.some(
      (row) => row.source_file === "paypal_consumer_fees.json"
    );

    if (!hasConsumerFees || lexicalResults.rows.length < 3) {
      console.log("🔍 Explicitly searching for consumer fee chunks...");
      const consumerFeeQuery = `
        SELECT 
          id, source_file, original_index, chunk_index, text,
          COALESCE(ts_rank(text_search_vector, plainto_tsquery($1)), 0) as rank
        FROM chunks 
        WHERE source_file = 'paypal_consumer_fees.json'
          AND (
            text_search_vector @@ plainto_tsquery($1)
            OR text ILIKE '%' || $1 || '%'
          )
        ORDER BY 
          CASE WHEN text_search_vector @@ plainto_tsquery($1) THEN 1 ELSE 2 END,
          rank DESC NULLS LAST
        LIMIT 5
      `;

      const consumerFeeResults = await dbClient.query(consumerFeeQuery, [
        query,
      ]);

      if (consumerFeeResults.rows.length > 0) {
        console.log(
          `✅ Found ${consumerFeeResults.rows.length} consumer fee chunks`
        );
        // Merge consumer fee results into lexical results (prioritize them)
        lexicalResults.rows = [
          ...consumerFeeResults.rows,
          ...lexicalResults.rows,
        ];
      }
    }
  }

  // 3. Combine and score results
  console.log("🔄 Combining results...");
  const combinedResults = combineSearchResults(
    semanticResults.matches,
    lexicalResults.rows,
    query // Pass query for fee query detection
  );

  return combinedResults;
}

/**
 * Combine semantic and lexical search results with scoring
 */
function combineSearchResults(semanticResults, lexicalResults, query = "") {
  const combined = new Map();

  // Detect if this is a fee-related query
  const isFeeQuery =
    /fee|fees|charge|charges|pricing|cost|rate|donation|donate/i.test(query);

  // Fee file sources to boost for fee queries
  const feeFileSources = [
    "paypal_consumer_fees.json",
    "paypal_merchant_fees.json",
    "paypal_braintree_fees.json",
  ];

  // Add semantic results (weight: 0.7)
  semanticResults.forEach((result) => {
    const id = result.id;
    let combinedScore = result.score * 0.7;

    // Boost fee file sources for fee queries
    if (
      isFeeQuery &&
      feeFileSources.some(
        (feeFile) =>
          result.metadata?.source?.includes(feeFile) || id.includes(feeFile)
      )
    ) {
      combinedScore *= 1.3; // 30% boost for fee files in fee queries
      console.log(
        `📈 Boosted fee file result: ${result.metadata?.source || id}`
      );
    }

    combined.set(id, {
      ...result,
      semanticScore: result.score,
      lexicalScore: 0,
      combinedScore,
      source: "semantic",
    });
  });

  // Add lexical results (weight: 0.3)
  lexicalResults.forEach((result) => {
    const id = `${result.source_file}:${result.original_index}:${result.chunk_index}`;
    let lexicalScore = result.rank;
    let combinedScore = lexicalScore * 0.3;

    // Boost fee file sources for fee queries
    if (isFeeQuery && feeFileSources.includes(result.source_file)) {
      combinedScore *= 1.3; // 30% boost for fee files in fee queries
      console.log(`📈 Boosted fee file lexical result: ${result.source_file}`);
    }

    if (combined.has(id)) {
      // Update existing result
      const existing = combined.get(id);
      existing.lexicalScore = lexicalScore;

      // Recalculate combined score if it was already boosted semantically
      if (isFeeQuery && feeFileSources.includes(result.source_file)) {
        existing.combinedScore =
          existing.semanticScore * 0.7 * 1.3 + lexicalScore * 0.3 * 1.3;
      } else {
        existing.combinedScore =
          existing.semanticScore * 0.7 + lexicalScore * 0.3;
      }
      existing.source = "hybrid";
    } else {
      // Add new result
      combined.set(id, {
        id,
        score: lexicalScore,
        semanticScore: 0,
        lexicalScore: lexicalScore,
        combinedScore,
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
