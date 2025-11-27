import User from "./User.js";
import Follow from "./Follow.js";

// Post model has been moved to Cassandra
// Removed Sequelize associations for Post

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

export { User, Follow };
