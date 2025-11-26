import User from "./User.js";
import Post from "./Post.js";
import Follow from "./Follow.js";

User.hasMany(Post, { foreignKey: "user_id", as: "posts" });
Post.belongsTo(User, { foreignKey: "user_id", as: "user" });

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

export { User, Post, Follow };
