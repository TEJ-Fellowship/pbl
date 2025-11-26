import { cassandraClient } from "../config/db.js";
import { KEYSPACE } from "../config/cassandra-schema.js";
import { types } from "cassandra-driver";
import { randomUUID } from "crypto";

/**
 * Create a new post
 * POST /api/posts
 */
export const createPost = async (req, res) => {
  try {
    const { user_id, caption, image_url, created_at } = req.body;

    if (!user_id || !image_url) {
      return res.status(400).json({
        success: false,
        message: "user_id and image_url are required",
      });
    }

    // Validate user_id is a number
    const userId = parseInt(user_id);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "user_id must be a valid number",
      });
    }

    // Auto-generate UUID as string
    const postIdString = randomUUID();
    const postId = types.Uuid.fromString(postIdString);
    const createdAt = created_at ? new Date(created_at) : new Date();

    // Insert into posts table with prepared statement
    const insertPostQuery = `
      INSERT INTO ${KEYSPACE}.posts (id, user_id, caption, image_url, likes_count, comments_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await cassandraClient.execute(
      insertPostQuery,
      [postId, userId, caption || null, image_url, 0, 0, createdAt],
      { prepare: true }
    );

    // Insert into posts_by_user table with prepared statement
    const insertPostByUserQuery = `
      INSERT INTO ${KEYSPACE}.posts_by_user (user_id, created_at, id, caption, image_url, likes_count, comments_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await cassandraClient.execute(
      insertPostByUserQuery,
      [userId, createdAt, postId, caption || null, image_url, 0, 0],
      { prepare: true }
    );

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: {
        id: postIdString,
        user_id: userId,
        caption: caption || null,
        image_url,
        likes_count: 0,
        comments_count: 0,
        created_at: createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
      error: error.message,
    });
  }
};

/**
 * Get post by ID
 * GET /api/posts/:id
 */
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `SELECT * FROM ${KEYSPACE}.posts WHERE id = ?`;
    const result = await cassandraClient.execute(query, [id], {
      prepare: true,
    });

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const post = result.rows[0];
    res.status(200).json({
      success: true,
      post: {
        id: post.id.toString(),
        user_id: post.user_id,
        caption: post.caption,
        image_url: post.image_url,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        created_at: post.created_at,
      },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post",
      error: error.message,
    });
  }
};

/**
 * Get all posts by a user
 * GET /api/posts/user/:user_id
 */
export const getPostsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const userId = parseInt(user_id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user_id",
      });
    }

    const query = `SELECT * FROM ${KEYSPACE}.posts_by_user WHERE user_id = ?`;
    const result = await cassandraClient.execute(query, [userId], {
      prepare: true,
    });

    const posts = result.rows.map((row) => ({
      id: row.id.toString(),
      user_id: row.user_id,
      caption: row.caption,
      image_url: row.image_url,
      likes_count: row.likes_count,
      comments_count: row.comments_count,
      created_at: row.created_at,
    }));

    res.status(200).json({
      success: true,
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user posts",
      error: error.message,
    });
  }
};

/**
 * Get all posts (limited)
 * GET /api/posts
 */
export const getAllPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const query = `SELECT * FROM ${KEYSPACE}.posts LIMIT ?`;
    const result = await cassandraClient.execute(query, [limit], {
      prepare: true,
    });

    const posts = result.rows.map((row) => ({
      id: row.id.toString(),
      user_id: row.user_id,
      caption: row.caption,
      image_url: row.image_url,
      likes_count: row.likes_count,
      comments_count: row.comments_count,
      created_at: row.created_at,
    }));

    res.status(200).json({
      success: true,
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
      error: error.message,
    });
  }
};
