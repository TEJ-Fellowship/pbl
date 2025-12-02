const { User, Post, Like, Comment, Follow } = require("../models/index");
const sequelize = require("../config/database");

// Configuration
const TOTAL_USERS = 1000;
const POSTS_PER_USER = 3; // Average posts per user
const FOLLOWS_PER_USER = 50; // Average follows per user (realistic)
const POSTS_TO_LIKE_RATIO = 0.3; // 30% of posts get likes
const POSTS_TO_COMMENT_RATIO = 0.15; // 15% of posts get comments

// Sample post contents
const POST_TEMPLATES = [
  "Just had an amazing day! 🌟",
  "Working on an exciting project!",
  "Beautiful sunset today!",
  "Coffee and coding ☕",
  "Can't believe it's already Friday!",
  "Learning new things every day 📚",
  "Great workout this morning! 💪",
  "Movie night with friends 🍿",
  "New recipe turned out perfectly! 👨‍🍳",
  "Road trip adventures 🚗",
  "Reading a fantastic book right now",
  "Weekend vibes are here! 🎉",
  "Early morning walk was refreshing",
  "Coding session went well today",
  "Dinner was delicious! 🍽️",
  "Sunny day perfect for a walk",
  "Just finished a great podcast",
  "Productive day at work",
  "Love this weather!",
  "Excited about upcoming plans",
];

// Sample comment templates
const COMMENT_TEMPLATES = [
  "Great post!",
  "I agree!",
  "Awesome!",
  "Well said!",
  "Totally relatable",
  "Thanks for sharing!",
  "This made my day!",
  "So true!",
  "Beautiful!",
  "Love this!",
];

// Generate unique username
function generateUsername(index) {
  const prefixes = ["user", "dev", "coder", "tech", "admin", "test", "demo"];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${randomPrefix}${index}`;
}

// Generate random post content
function generatePostContent() {
  return POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)];
}

// Generate random comment
function generateComment() {
  return COMMENT_TEMPLATES[
    Math.floor(Math.random() * COMMENT_TEMPLATES.length)
  ];
}

// Create users in batches
async function createUsersBatch(batchSize, startIndex, totalUsers) {
  const users = [];
  for (let i = 0; i < batchSize && startIndex + i < totalUsers; i++) {
    users.push({
      username: generateUsername(startIndex + i),
    });
  }
  return await User.bulkCreate(users, { returning: true });
}

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting large-scale database seeding...");
    console.log(`📊 Configuration:`);
    console.log(`   - Users: ${TOTAL_USERS}`);
    console.log(`   - Posts per user: ${POSTS_PER_USER}`);
    console.log(`   - Follows per user: ${FOLLOWS_PER_USER}`);

    // Sync database
    await sequelize.authenticate();
    console.log("\n✅ Database connected");

    // Clear existing data
    console.log("\n🗑️  Clearing existing data...");
    await Comment.destroy({ where: {}, truncate: true, cascade: true });
    await Like.destroy({ where: {}, truncate: true, cascade: true });
    await Post.destroy({ where: {}, truncate: true, cascade: true });
    await Follow.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });

    console.log("🔄 Resetting auto-increment sequences...");
    try {
      await sequelize.query("ALTER SEQUENCE users_id_seq RESTART WITH 1");
      await sequelize.query("ALTER SEQUENCE posts_id_seq RESTART WITH 1");
      await sequelize.query("ALTER SEQUENCE comments_id_seq RESTART WITH 1");
      console.log("✅ Sequences reset");
    } catch (error) {
      console.error("❌ Error resetting sequences:", error);
    }

    console.log("✅ Existing data cleared");

    // Create Users in batches (more efficient for large numbers)
    console.log(`\n👥 Creating ${TOTAL_USERS} users (in batches of 100)...`);
    const allUsers = [];
    const batchSize = 100;

    for (let i = 0; i < TOTAL_USERS; i += batchSize) {
      const batch = await createUsersBatch(batchSize, i, TOTAL_USERS);
      allUsers.push(...batch);

      if ((i + batchSize) % 500 === 0 || i + batchSize >= TOTAL_USERS) {
        console.log(
          `   ✅ Created ${Math.min(i + batchSize, TOTAL_USERS)} users...`
        );
      }
    }
    console.log(`✅ Created ${allUsers.length} users total`);

    // Create Posts
    console.log(`\n📝 Creating posts (${POSTS_PER_USER} per user)...`);
    const allPosts = [];
    const postsBatchSize = 200;

    for (let i = 0; i < allUsers.length; i++) {
      const userPosts = [];
      const numPosts = Math.floor(Math.random() * 5) + 1; // 1-5 posts per user

      for (let j = 0; j < numPosts; j++) {
        userPosts.push({
          user_id: allUsers[i].id,
          content: generatePostContent(),
          image_urls: [],
          likes_count: 0,
          comments_count: 0,
        });
      }

      const createdPosts = await Post.bulkCreate(userPosts, {
        returning: true,
      });
      allPosts.push(...createdPosts);

      if (allPosts.length % 500 === 0) {
        console.log(`   ✅ Created ${allPosts.length} posts...`);
      }
    }
    console.log(`✅ Created ${allPosts.length} posts total`);

    // Create Follows (realistic follow relationships)
    console.log(`\n👥 Creating follow relationships...`);
    const allFollows = [];
    const followsBatchSize = 500;

    for (let i = 0; i < allUsers.length; i++) {
      const userFollows = [];
      const numFollows = Math.floor(Math.random() * FOLLOWS_PER_USER * 2) + 10; // 10-110 follows per user

      // Get random users to follow (avoid self-follows and duplicates)
      const followingIds = new Set();
      while (followingIds.size < Math.min(numFollows, allUsers.length - 1)) {
        const randomUserId =
          allUsers[Math.floor(Math.random() * allUsers.length)].id;
        if (randomUserId !== allUsers[i].id) {
          followingIds.add(randomUserId);
        }
      }

      for (const followingId of followingIds) {
        userFollows.push({
          follower_id: allUsers[i].id,
          following_id: followingId,
        });
      }

      if (userFollows.length > 0) {
        const createdFollows = await Follow.bulkCreate(userFollows);
        allFollows.push(...createdFollows);
      }

      if ((i + 1) % 100 === 0) {
        console.log(`   ✅ Created follows for ${i + 1} users...`);
      }
    }
    console.log(`✅ Created ${allFollows.length} follow relationships total`);

    // Create Likes
    console.log(`\n❤️  Creating likes...`);
    const postsToLike = Math.floor(allPosts.length * POSTS_TO_LIKE_RATIO);
    const likedPostIds = [];

    // Select random posts to receive likes
    for (let i = 0; i < postsToLike; i++) {
      const randomPost = allPosts[Math.floor(Math.random() * allPosts.length)];
      if (!likedPostIds.includes(randomPost.id)) {
        likedPostIds.push(randomPost.id);
      }
    }

    const allLikes = [];
    const likesBatchSize = 500;

    for (const postId of likedPostIds) {
      const numLikes = Math.floor(Math.random() * 20) + 1; // 1-20 likes per post
      const likes = [];

      // Get random users to like this post
      const likerIds = new Set();
      while (likerIds.size < Math.min(numLikes, allUsers.length)) {
        const randomUser =
          allUsers[Math.floor(Math.random() * allUsers.length)];
        likerIds.add(randomUser.id);
      }

      for (const userId of likerIds) {
        likes.push({
          user_id: userId,
          post_id: postId,
        });
      }

      if (likes.length > 0) {
        const createdLikes = await Like.bulkCreate(likes);
        allLikes.push(...createdLikes);

        // Update likes_count
        await Post.update(
          { likes_count: likes.length },
          { where: { id: postId } }
        );
      }

      if (allLikes.length % 500 === 0) {
        console.log(`   ✅ Created ${allLikes.length} likes...`);
      }
    }
    console.log(`✅ Created ${allLikes.length} likes total`);

    // Create Comments
    console.log(`\n💬 Creating comments...`);
    const postsToComment = Math.floor(allPosts.length * POSTS_TO_COMMENT_RATIO);
    const commentedPostIds = [];

    // Select random posts to receive comments
    for (let i = 0; i < postsToComment; i++) {
      const randomPost = allPosts[Math.floor(Math.random() * allPosts.length)];
      if (!commentedPostIds.includes(randomPost.id)) {
        commentedPostIds.push(randomPost.id);
      }
    }

    const allComments = [];
    const commentsBatchSize = 500;

    for (const postId of commentedPostIds) {
      const numComments = Math.floor(Math.random() * 10) + 1; // 1-10 comments per post
      const comments = [];

      // Get random users to comment on this post
      const commenterIds = new Set();
      while (commenterIds.size < Math.min(numComments, allUsers.length)) {
        const randomUser =
          allUsers[Math.floor(Math.random() * allUsers.length)];
        commenterIds.add(randomUser.id);
      }

      for (const userId of commenterIds) {
        comments.push({
          user_id: userId,
          post_id: postId,
          content: generateComment(),
        });
      }

      if (comments.length > 0) {
        const createdComments = await Comment.bulkCreate(comments);
        allComments.push(...createdComments);

        // Update comments_count
        await Post.update(
          { comments_count: comments.length },
          { where: { id: postId } }
        );
      }

      if (allComments.length % 500 === 0) {
        console.log(`   ✅ Created ${allComments.length} comments...`);
      }
    }
    console.log(`✅ Created ${allComments.length} comments total`);

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📊 Final Summary:");
    console.log(`   - Users: ${allUsers.length}`);
    console.log(`   - Posts: ${allPosts.length}`);
    console.log(`   - Follows: ${allFollows.length}`);
    console.log(`   - Likes: ${allLikes.length}`);
    console.log(`   - Comments: ${allComments.length}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    await sequelize.close();
    process.exit(1);
  }
};

// Run seed
seedDatabase();
