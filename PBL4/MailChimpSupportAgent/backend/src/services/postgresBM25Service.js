import pool from "../../config/postgresconfig.js";

class PostgreSQLBM25Service {
  constructor() {
    this.pool = pool;
  }

  /** Insert a single document chunk into the database */
  async insertChunk(chunk) {
    const client = await this.pool.connect();

    try {
      const query = `
        INSERT INTO documents_chunks (
          chunk_id,
          pageContent,
          metadata, 
          title, 
          category, 
          doc_type, 
          chunk_index, 
          total_chunks,
          published_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (chunk_id) DO UPDATE SET
          pageContent = EXCLUDED.pageContent,
          metadata = EXCLUDED.metadata,
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          doc_type = EXCLUDED.doc_type,
          chunk_index = EXCLUDED.chunk_index,
          total_chunks = EXCLUDED.total_chunks,
          published_date = EXCLUDED.published_date
      `;

      const values = [
        chunk.chunk_id ||
          `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chunk.content || chunk.pageContent,
        JSON.stringify(chunk.metadata || {}),
        chunk.title || "Untitled",
        chunk.category || "general",
        chunk.docType || "article",
        chunk.chunk_index || 0,
        chunk.total_chunks || 1,
        chunk.publishedDate || new Date().toISOString(),
      ];

      await client.query(query, values);
    } catch (error) {
      console.error("Failed to insert chunk:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /** Insert multiple document chunks into the database */
  async insertChunks(chunks) {
    if (!Array.isArray(chunks)) {
      throw new Error("chunks must be an array");
    }

    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      for (const chunk of chunks) {
        const query = `
          INSERT INTO documents_chunks (
            chunk_id,
            pageContent,
            metadata, 
            title, 
            category, 
            doc_type, 
            chunk_index, 
            total_chunks,
            published_date
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (chunk_id) DO UPDATE SET
            pageContent = EXCLUDED.pageContent,
            metadata = EXCLUDED.metadata,
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            doc_type = EXCLUDED.doc_type,
            chunk_index = EXCLUDED.chunk_index,
            total_chunks = EXCLUDED.total_chunks,
            published_date = EXCLUDED.published_date
        `;

        const values = [
          chunk.metadata?.chunk_id ||
            `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          chunk.pageContent || chunk.content,
          JSON.stringify(chunk.metadata || {}),
          chunk.title || chunk.metadata?.title || "Untitled",
          chunk.category || chunk.metadata?.category || "general",
          chunk.docType || chunk.metadata?.docType || "article",
          chunk.chunk_index || chunk.metadata?.chunk_index || 0,
          chunk.total_chunks || chunk.metadata?.total_chunks || 1,
          chunk.publishedDate ||
            chunk.metadata?.publishedDate ||
            new Date().toISOString(),
        ];

        await client.query(query, values);
      }

      await client.query("COMMIT");
      console.log(
        `✅ Inserted ${chunks.length} Mailchimp chunks into PostgreSQL`
      );
    } catch (error) {
      await client.query("ROLLBACK");
      console.log("Failed to insert Mailchimp chunks:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Perform BM25 search using PostgreSQL full-text search
   */
  async searchBM25(query, topK = 10, filters = {}) {
    const client = await this.pool.connect();

    try {
      let whereClause =
        "to_tsvector('english', pagecontent) @@ plainto_tsquery('english', $1)";
      let queryParams = [query];
      let paramIndex = 2;

      // Add filters
      if (filters.category) {
        whereClause += ` AND category = $${paramIndex}`;
        queryParams.push(filters.category);
        paramIndex++;
      }

      if (filters.docType) {
        whereClause += ` AND doc_type = $${paramIndex}`;
        queryParams.push(filters.docType);
        paramIndex++;
      }

      const query_sql = `
        SELECT 
          chunk_id,
          pagecontent,
          metadata,
          title,
          category,
          doc_type,
          chunk_index,
          total_chunks,
          published_date,
          ts_rank(to_tsvector('english', pagecontent), plainto_tsquery('english', $1)) as bm25_score
        FROM documents_chunks 
        WHERE ${whereClause}
        ORDER BY bm25_score DESC 
        LIMIT $${paramIndex}
      `;

      queryParams.push(topK);

      const result = await client.query(query_sql, queryParams);

      return result.rows.map((row) => {
        let parsedMetadata = {};
        try {
          parsedMetadata =
            typeof row.metadata === "string"
              ? JSON.parse(row.metadata)
              : row.metadata || {};
        } catch (error) {
          console.warn("Failed to parse metadata:", error.message);
          parsedMetadata = {};
        }

        return {
          id: row.chunk_id,
          content: row.pagecontent,
          metadata: {
            ...parsedMetadata,
            title: row.title,
            category: row.category,
            docType: row.doc_type,
            chunk_index: row.chunk_index,
            total_chunks: row.total_chunks,
          },
          bm25Score: parseFloat(row.bm25_score),
          source: parsedMetadata?.source || "unknown",
          title: row.title,
          category: row.category,
          publishedDate: row.published_date,
        };
      });
    } catch (error) {
      console.error("BM25 search failed:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const client = await this.pool.connect();

    try {
      const totalQuery = "SELECT COUNT(*) as total FROM documents_chunks";
      const categoryQuery =
        "SELECT COUNT(DISTINCT category) as categories FROM documents_chunks";

      const [totalResult, categoryResult] = await Promise.all([
        client.query(totalQuery),
        client.query(categoryQuery),
      ]);

      return {
        total_chunks: parseInt(totalResult.rows[0].total),
        categories: parseInt(categoryResult.rows[0].categories),
      };
    } catch (error) {
      console.error("Failed to get stats:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Clear all documents from the database
   */
  async clearAll() {
    const client = await this.pool.connect();

    try {
      await client.query("DELETE FROM documents_chunks");
      console.log("✅ Cleared all documents from PostgreSQL");
    } catch (error) {
      console.error("Failed to clear documents:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default PostgreSQLBM25Service;
