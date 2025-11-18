import User from "./User.js";
import Post from "./Post.js";
import Follow from "./Follow.js";
import Like from "./Like.js";
import Comment from "./Comment.js";

// Define associations
User.hasMany(Post, { foreignKey: "user_id", as: "posts" });
Post.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Self-referential many-to-many relationship for follows
User.belongsToMany(User, {
  through: Follow,
  foreignKey: "follower_id",
  otherKey: "following_id",
  as: "following",
});

User.belongsToMany(User, {
  through: Follow,
  foreignKey: "following_id",
  otherKey: "follower_id",
  as: "followers",
});

// User to Likes relationship
User.hasMany(Like, { foreignKey: "user_id", as: "likes" });
Like.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Post to Likes relationship
Post.hasMany(Like, { foreignKey: "post_id", as: "likes" });
Like.belongsTo(Post, { foreignKey: "post_id", as: "post" });

// User to Comments relationship
User.hasMany(Comment, { foreignKey: "user_id", as: "comments" });
Comment.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Post to Comments relationship
Post.hasMany(Comment, { foreignKey: "post_id", as: "comments" });
Comment.belongsTo(Post, { foreignKey: "post_id", as: "post" });

export { User, Post, Follow, Like, Comment };
