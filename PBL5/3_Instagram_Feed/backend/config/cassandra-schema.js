import { cassandraClient } from "./db.js";

const KEYSPACE = process.env.CASSANDRA_KEYSPACE || "memogram";

/**
 * Creates the keyspace if it doesn't exist
 * If permission is denied (common in managed Cassandra/AstraDB), just use the existing keyspace
 */
const createKeyspace = async () => {
  try {
    const createKeyspaceQuery = `
      CREATE KEYSPACE IF NOT EXISTS ${KEYSPACE}
      WITH replication = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
      }
    `;

    await cassandraClient.execute(createKeyspaceQuery);
  } catch (error) {
    // If permission denied (common in managed Cassandra/AstraDB), keyspace likely already exists
    // Error code 8448 = Missing correct permission
    if (error.code !== 8448 && !error.message?.includes("permission")) {
      console.error(`❌ Error creating keyspace '${KEYSPACE}':`, error);
      throw error;
    }
  }

  // Use the keyspace (whether we created it or it already exists)
  try {
    await cassandraClient.execute(`USE ${KEYSPACE}`);
  } catch (error) {
    console.error(`❌ Error using keyspace '${KEYSPACE}':`, error);
    throw error;
  }
};

/**
 * Creates the posts table
 * This table stores posts by post_id for direct post lookups
 */
const createPostsTable = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY,
        user_id INT,
        caption TEXT,
        image_url TEXT,
        likes_count INT,
        comments_count INT,
        created_at TIMESTAMP
      )
    `;

    await cassandraClient.execute(createTableQuery);
  } catch (error) {
    console.error("❌ Error creating 'posts' table:", error);
    throw error;
  }
};

/**
 * Creates the posts_by_user table
 * This table stores posts partitioned by user_id, ordered by created_at
 * Allows efficient querying of all posts by a specific user
 */
const createPostsByUserTable = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS posts_by_user (
        user_id INT,
        created_at TIMESTAMP,
        id UUID,
        caption TEXT,
        image_url TEXT,
        likes_count INT,
        comments_count INT,
        PRIMARY KEY (user_id, created_at, id)
      ) WITH CLUSTERING ORDER BY (created_at DESC)
    `;

    await cassandraClient.execute(createTableQuery);
  } catch (error) {
    console.error("❌ Error creating 'posts_by_user' table:", error);
    throw error;
  }
};

/**
 * Creates the feeds_by_user table
 * This table stores posts in each user's feed (fan-out architecture)
 * Partitioned by user_id, ordered by created_at DESC
 * Allows efficient querying of a user's personalized feed
 */
const createFeedsByUserTable = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS feeds_by_user (
        user_id INT,
        created_at TIMESTAMP,
        post_id UUID,
        PRIMARY KEY (user_id, created_at, post_id)
      ) WITH CLUSTERING ORDER BY (created_at DESC)
    `;

    await cassandraClient.execute(createTableQuery);
  } catch (error) {
    console.error("❌ Error creating 'feeds_by_user' table:", error);
    throw error;
  }
};

/**
 * Initializes the Cassandra schema
 * Creates keyspace and all required tables
 */
const initializeSchema = async () => {
  try {
    await createKeyspace();
    await createPostsTable();
    await createPostsByUserTable();
    await createFeedsByUserTable();
  } catch (error) {
    console.error("❌ Error initializing Cassandra schema:", error);
    throw error;
  }
};

export { initializeSchema, KEYSPACE };
