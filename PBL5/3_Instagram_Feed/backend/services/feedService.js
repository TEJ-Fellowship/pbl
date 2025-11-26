import { cassandraClient } from "../config/db.js";
import { KEYSPACE } from "../config/cassandra-schema.js";
import { types } from "cassandra-driver";
import { Follow } from "../models/index.js";

/**
 * Add a post to a user's feed
 * @param {number} userId - User ID whose feed to update
 * @param {string} postId - Post UUID string
 * @param {Date} createdAt - Post creation timestamp
 */
export const addPostToFeed = async (userId, postId, createdAt) => {
  const postIdUuid = types.Uuid.fromString(postId);
  const userIdInt = parseInt(userId);

  const query = `
    INSERT INTO ${KEYSPACE}.feeds_by_user (user_id, created_at, post_id)
    VALUES (?, ?, ?)
  `;

  await cassandraClient.execute(query, [userIdInt, createdAt, postIdUuid], {
    prepare: true,
  });
};

/**
 * Fan-out: Add post to all followers' feeds
 * @param {number} userId - User who created the post
 * @param {string} postId - Post UUID string
 * @param {Date} createdAt - Post creation timestamp
 */
export const fanOutToFollowers = async (userId, postId, createdAt) => {
  // Get all followers of the user who posted
  const followers = await Follow.findAll({
    where: {
      following_id: userId, // People who follow this user
    },
    attributes: ["follower_id"],
  });

  console.log(
    `📤 Fan-out: Adding post ${postId} to ${followers.length} followers' feeds`
  );

  // Add post to each follower's feed
  const promises = followers.map((follow) =>
    addPostToFeed(follow.follower_id, postId, createdAt)
  );

  await Promise.all(promises);

  return followers.length;
};

/**
 * Get user's feed (returns post IDs with timestamps)
 * @param {number} userId - User ID
 * @param {number} limit - Maximum number of posts to return
 * @returns {Array} Array of post IDs with timestamps
 */
export const getFeed = async (userId, limit = 20) => {
  const userIdInt = parseInt(userId);
  const limitInt = parseInt(limit);

  const query = `
    SELECT post_id, created_at 
    FROM ${KEYSPACE}.feeds_by_user 
    WHERE user_id = ? 
    LIMIT ?
  `;

  const result = await cassandraClient.execute(query, [userIdInt, limitInt], {
    prepare: true,
  });

  return result.rows.map((row) => ({
    post_id: row.post_id.toString(),
    created_at: row.created_at,
  }));
};
