import pool from "../config/database.js";
import QueryPreprocessor from "../utils/queryPreprocessor.js";

class PostgreSQLBM25Service {
  constructor() {
    this.pool = pool;
    this.queryPreprocessor = new QueryPreprocessor();
  }

  /**
   * Insert document chunks into PostgreSQL for BM25 search
   */
  async insertChunks(chunks) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const insertPromises = chunks.map(async (chunk) => {
        const query = `
          INSERT INTO document_chunks 
          (chunk_id, content, metadata, title, category, source, word_count)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (chunk_id) DO UPDATE SET
          content = EXCLUDED.content,
          metadata = EXCLUDED.metadata,
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          source = EXCLUDED.source,
          word_count = EXCLUDED.word_count,
          updated_at = NOW()
        `;

        const values = [
          chunk.id ||
            chunk.metadata?.chunk_id ||
            `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          chunk.content || chunk.pageContent || "",
          JSON.stringify(chunk.metadata),
          chunk.metadata?.title || "",
          chunk.metadata?.category || "documentation",
          chunk.metadata?.source || "",
          chunk.metadata?.wordCount || 0,
        ];

        return client.query(query, values);
      });

      await Promise.all(insertPromises);
      await client.query("COMMIT");

      console.log(
        `✅ Inserted ${chunks.length} chunks into PostgreSQL for BM25 search`
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Perform BM25 search using PostgreSQL full-text search with query preprocessing
   */
  async searchBM25(query, topK = 10, filters = {}) {
    const client = await this.pool.connect();

    try {
      // Preprocess the query for better BM25 compatibility
      const processedQuery = this.queryPreprocessor.preprocessForBM25(query);

      if (!processedQuery) {
        console.log(
          "⚠️ Query preprocessing resulted in empty query, using original"
        );
        return [];
      }

      // Generate query variations for better coverage
      const queryVariations =
        this.queryPreprocessor.generateQueryVariations(query);

      let allResults = new Map(); // Use Map to avoid duplicates
      let paramIndex = 1;

      // Try each query variation
      for (const variation of queryVariations) {
        try {
          let whereClause =
            "to_tsvector('english', content) @@ plainto_tsquery('english', $1)";
          let queryParams = [variation];
          let currentParamIndex = 2;

          // Add filters
          if (filters.category) {
            whereClause += ` AND category = $${currentParamIndex}`;
            queryParams.push(filters.category);
            currentParamIndex++;
          }

          if (filters.source) {
            whereClause += ` AND source = $${currentParamIndex}`;
            queryParams.push(filters.source);
            currentParamIndex++;
          }

          const query_sql = `
            SELECT 
              chunk_id,
              content,
              metadata,
              title,
              category,
              source,
              word_count,
              ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) as bm25_score
            FROM document_chunks 
            WHERE ${whereClause}
            ORDER BY bm25_score DESC 
            LIMIT $${currentParamIndex}
          `;

          queryParams.push(Math.min(topK, 20)); // Limit per variation

          const result = await client.query(query_sql, queryParams);

          // Add results to our collection, avoiding duplicates
          result.rows.forEach((row) => {
            const key = row.chunk_id;
            if (
              !allResults.has(key) ||
              allResults.get(key).bm25Score < row.bm25_score
            ) {
              allResults.set(key, {
                id: row.chunk_id,
                content: row.content,
                metadata: row.metadata,
                title: row.title,
                category: row.category,
                source: row.source,
                bm25Score: parseFloat(row.bm25_score),
                searchType: "postgres_bm25",
              });
            }
          });
        } catch (variationError) {
          console.warn(
            `⚠️ Query variation "${variation}" failed:`,
            variationError.message
          );
        }
      }

      // Convert Map to array and sort by score
      const results = Array.from(allResults.values())
        .sort((a, b) => b.bm25Score - a.bm25Score)
        .slice(0, topK);

      console.log(
        `📊 BM25 search found ${results.length} results from ${queryVariations.length} variations`
      );
      return results;
    } catch (error) {
      console.error("❌ BM25 search failed:", error.message);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Get document statistics
   */
  async getStats() {
    const client = await this.pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_chunks,
          AVG(word_count) as avg_word_count,
          COUNT(DISTINCT category) as categories,
          COUNT(DISTINCT source) as sources
        FROM document_chunks
      `);

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  async close() {
    await this.pool.end();
  }
}

export default PostgreSQLBM25Service;
