import config from "../config/config.js";

export const healthController = {
  /**
   * Basic health check
   */
  async getHealth(req, res) {
    try {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: "1.0.0",
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  /**
   * Detailed system status
   */
  async getStatus(req, res) {
    try {
      const status = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        services: {
          database: await checkDatabaseConnection(),
          pinecone: await checkPineconeConnection(),
          gemini: await checkGeminiConnection(),
        },
      };

      res.json(status);
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },
};

/**
 * Check database connection
 */
async function checkDatabaseConnection() {
  try {
    // Import here to avoid circular dependencies
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: config.DATABASE_URL,
    });

    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    await pool.end();

    return { status: "connected", message: "Database connection successful" };
  } catch (error) {
    return { status: "disconnected", error: error.message };
  }
}

/**
 * Check Pinecone connection
 */
async function checkPineconeConnection() {
  try {
    const { Pinecone } = await import("@pinecone-database/pinecone");
    const pinecone = new Pinecone({ apiKey: config.PINECONE_API_KEY });
    const index = pinecone.Index(config.PINECONE_INDEX_NAME);

    // Simple stats query to test connection
    const stats = await index.describeIndexStats();

    return {
      status: "connected",
      message: "Pinecone connection successful",
      stats: {
        totalVectorCount: stats.totalVectorCount,
        dimension: stats.dimension,
      },
    };
  } catch (error) {
    return { status: "disconnected", error: error.message };
  }
}

/**
 * Check Gemini connection
 */
async function checkGeminiConnection() {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Simple test generation
    const result = await model.generateContent("test");
    await result.response;

    return { status: "connected", message: "Gemini API connection successful" };
  } catch (error) {
    return { status: "disconnected", error: error.message };
  }
}
