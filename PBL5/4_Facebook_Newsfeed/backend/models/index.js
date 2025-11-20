const sequelize = require('../config/database');
const User = require('./user');
const Post = require('./post');
const Like = require('./like');
const Comment = require('./comment');
const Follow = require('./follow');

// RELATIONSHIP 1: User → Posts (One-to-Many)
// One user can create many posts
User.hasMany(Post, {
  foreignKey: 'user_id',
  as: 'posts',
});
Post.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'author',
});

// RELATIONSHIP 2: User ↔ Posts (Many-to-Many via Likes)
// Many users can like many posts (junction table: likes)
User.belongsToMany(Post, {
  through: Like,
  foreignKey: 'user_id',
  otherKey: 'post_id',
  as: 'likedPosts',
});
Post.belongsToMany(User, {
  through: Like,
  foreignKey: 'post_id',
  otherKey: 'user_id',
  as: 'likedBy',
});

// RELATIONSHIP 3: User → Comments (One-to-Many)
// One user can write many comments
User.hasMany(Comment, {
  foreignKey: 'user_id',
  as: 'comments',
});
Comment.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'commenter',
});


// RELATIONSHIP 4: Post → Comments (One-to-Many)
// One post can have many comments
Post.hasMany(Comment, {
  foreignKey: 'post_id',
  as: 'comments',
});
Comment.belongsTo(Post, {
  foreignKey: 'post_id',
  as: 'post',
});

// RELATIONSHIP 5: User ↔ User (Self-referential Many-to-Many via Follows)
// Users can follow other users (junction table: follows)
User.belongsToMany(User, {
  through: Follow,
  foreignKey: 'follower_id',
  otherKey: 'following_id',
  as: 'following',
});
User.belongsToMany(User, {
  through: Follow,
  foreignKey: 'following_id',
  otherKey: 'follower_id',
  as: 'followers',
});

// Export all models
const models = {
  User,
  Post,
  Like,
  Comment,
  Follow,
  sequelize,
};

module.exports = models;
