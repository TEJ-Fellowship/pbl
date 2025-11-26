import { cassandraClient } from "../config/db.js";
import { KEYSPACE } from "../config/cassandra-schema.js";
import { types } from "cassandra-driver";
import { randomUUID } from "crypto";

/**
 * Create a new post
 * @param {Object} postData - { user_id, caption, image_url, created_at }
 * @returns {Object} Created post
 */
export const createPost = async (postData) => {
  const { user_id, caption, image_url, created_at } = postData;

  if (!user_id || !image_url) {
    throw new Error("user_id and image_url are required");
  }

  const userId = parseInt(user_id);
  if (isNaN(userId)) {
    throw new Error("user_id must be a valid number");
  }

  // Auto-generate UUID as string
  const postIdString = randomUUID();
  const postId = types.Uuid.fromString(postIdString);
  const createdAt = created_at ? new Date(created_at) : new Date();

  // Insert into posts table
  const insertPostQuery = `
    INSERT INTO ${KEYSPACE}.posts (id, user_id, caption, image_url, likes_count, comments_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  await cassandraClient.execute(
    insertPostQuery,
    [postId, userId, caption || null, image_url, 0, 0, createdAt],
    { prepare: true }
  );

  // Insert into posts_by_user table
  const insertPostByUserQuery = `
    INSERT INTO ${KEYSPACE}.posts_by_user (user_id, created_at, id, caption, image_url, likes_count, comments_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  await cassandraClient.execute(
    insertPostByUserQuery,
    [userId, createdAt, postId, caption || null, image_url, 0, 0],
    { prepare: true }
  );

  return {
    id: postIdString,
    user_id: userId,
    caption: caption || null,
    image_url,
    likes_count: 0,
    comments_count: 0,
    created_at: createdAt,
  };
};

/**
 * Get post by ID
 * @param {string} postId - UUID string
 * @returns {Object|null} Post object or null if not found
 */
export const getPostById = async (postId) => {
  const postIdUuid = types.Uuid.fromString(postId);
  const query = `SELECT * FROM ${KEYSPACE}.posts WHERE id = ?`;
  const result = await cassandraClient.execute(query, [postIdUuid], {
    prepare: true,
  });

  if (result.rows.length === 0) {
    return null;
  }

  const post = result.rows[0];
  return {
    id: post.id.toString(),
    user_id: post.user_id,
    caption: post.caption,
    image_url: post.image_url,
    likes_count: post.likes_count,
    comments_count: post.comments_count,
    created_at: post.created_at,
  };
};

/**
 * Get all posts by a user
 * @param {number} userId - User ID
 * @returns {Array} Array of posts
 */
export const getPostsByUser = async (userId) => {
  const userIdInt = parseInt(userId);
  if (isNaN(userIdInt)) {
    throw new Error("Invalid user_id");
  }

  const query = `SELECT * FROM ${KEYSPACE}.posts_by_user WHERE user_id = ?`;
  const result = await cassandraClient.execute(query, [userIdInt], {
    prepare: true,
  });

  return result.rows.map((row) => ({
    id: row.id.toString(),
    user_id: row.user_id,
    caption: row.caption,
    image_url: row.image_url,
    likes_count: row.likes_count,
    comments_count: row.comments_count,
    created_at: row.created_at,
  }));
};

/**
 * Get multiple posts by their IDs (batch fetch)
 * @param {Array<string>} postIds - Array of UUID strings
 * @returns {Array} Array of posts
 */
export const getPostsByIds = async (postIds) => {
  if (!postIds || postIds.length === 0) {
    return [];
  }

  // Convert string UUIDs to UUID types
  const uuidPostIds = postIds.map((id) => types.Uuid.fromString(id));

  // Use IN clause for batch fetch
  const placeholders = postIds.map(() => "?").join(",");
  const query = `SELECT * FROM ${KEYSPACE}.posts WHERE id IN (${placeholders})`;

  const result = await cassandraClient.execute(query, uuidPostIds, {
    prepare: true,
  });

  return result.rows.map((row) => ({
    id: row.id.toString(),
    user_id: row.user_id,
    caption: row.caption,
    image_url: row.image_url,
    likes_count: row.likes_count,
    comments_count: row.comments_count,
    created_at: row.created_at,
  }));
};

/**
 * Get all posts (limited)
 * @param {number} limit - Maximum number of posts to return
 * @returns {Array} Array of posts
 */
export const getAllPosts = async (limit = 50) => {
  const limitInt = parseInt(limit);
  const query = `SELECT * FROM ${KEYSPACE}.posts LIMIT ?`;
  const result = await cassandraClient.execute(query, [limitInt], {
    prepare: true,
  });

  return result.rows.map((row) => ({
    id: row.id.toString(),
    user_id: row.user_id,
    caption: row.caption,
    image_url: row.image_url,
    likes_count: row.likes_count,
    comments_count: row.comments_count,
    created_at: row.created_at,
  }));
};
