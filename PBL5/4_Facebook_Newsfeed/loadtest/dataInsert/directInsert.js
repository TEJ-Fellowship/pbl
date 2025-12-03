/**
 * Direct Database Insertion Script
 * 
 * This script directly inserts data into the database without using API calls.
 * It assumes users with IDs 1-1100 already exist in the database.
 * 
 * Usage:
 *   From project root: node loadtest/dataInsert/directInsert.js
 *   Or from loadtest folder: npm run insert-data
 * 
 * What it does:
 * - Creates posts (avg 5 per user) with meaningful text content
 * - Creates likes (avg 15 per post)
 * - Creates comments (avg 2-3 per post)
 * - Creates follows (avg 50-60 followers per user)
 * - Displays comprehensive statistics
 */

const { faker } = require('@faker-js/faker');
const path = require('path');
const fs = require('fs');

// Load environment variables from backend/.env
// This ensures the script can find the .env file when run from different directories
try {
  const dotenv = require('dotenv');
  const backendEnvPath = path.join(__dirname, '../../backend/.env');
  if (fs.existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath });
  } else {
    // Try loading from project root
    const rootEnvPath = path.join(__dirname, '../../.env');
    if (fs.existsSync(rootEnvPath)) {
      dotenv.config({ path: rootEnvPath });
    } else {
      // Fallback to default dotenv behavior (looks for .env in current and parent directories)
      dotenv.config();
    }
  }
} catch (error) {
  console.warn('Warning: dotenv not found. Make sure environment variables are set.');
  console.warn('You may need to install dotenv: npm install dotenv --save-dev');
}

// Import database models from backend
const sequelize = require('../../backend/config/database');
// Load models and relationships
require('../../backend/models/index');
const User = require('../../backend/models/user');
const Post = require('../../backend/models/post');
const Like = require('../../backend/models/like');
const Comment = require('../../backend/models/comment');
const Follow = require('../../backend/models/follow');

// Configuration
const TOTAL_USERS = 1100;
const AVG_POSTS_PER_USER = 5;
const AVG_LIKES_PER_POST = 15;
const AVG_FOLLOWERS_PER_USER = 55; // Average of 50-60
const AVG_COMMENTS_PER_POST = 2.5; // Average of 2-3

// Post content templates for meaningful posts
const postTemplates = [
  // Personal updates
  () => `Just finished ${faker.hacker.verb()} ${faker.hacker.noun()}. ${faker.lorem.sentence()}`,
  () => `Having an amazing day! ${faker.lorem.sentence()}`,
  () => `Can't believe it's already ${faker.date.weekday()}! ${faker.lorem.sentence()}`,
  () => `Just discovered ${faker.company.name()}. ${faker.lorem.sentence()}`,
  
  // Thoughts and opinions
  () => `Thinking about ${faker.word.noun()} today. ${faker.lorem.sentence()}`,
  () => `What do you think about ${faker.word.noun()}? ${faker.lorem.sentence()}`,
  () => `I've been reflecting on ${faker.word.noun()} lately. ${faker.lorem.sentence()}`,
  
  // Questions
  () => `Anyone else ${faker.word.verb()} ${faker.word.noun()}? ${faker.lorem.sentence()}`,
  () => `What's your favorite ${faker.word.noun()}? ${faker.lorem.sentence()}`,
  () => `Need recommendations for ${faker.word.noun()}. ${faker.lorem.sentence()}`,
  
  // Experiences
  () => `Just tried ${faker.word.noun()} for the first time. ${faker.lorem.sentence()}`,
  () => `Had an incredible experience with ${faker.word.noun()}. ${faker.lorem.sentence()}`,
  () => `Visited ${faker.location.city()} today. ${faker.lorem.sentence()}`,
  
  // Motivational
  () => `Remember: ${faker.lorem.sentence()}`,
  () => `Today's goal: ${faker.word.verb()} ${faker.word.noun()}. ${faker.lorem.sentence()}`,
  () => `Feeling motivated to ${faker.word.verb()} ${faker.word.noun()}. ${faker.lorem.sentence()}`,
  
  // Random meaningful
  () => `${faker.lorem.paragraph({ min: 2, max: 4 })}`,
  () => `${faker.lorem.sentences({ min: 2, max: 4 })}`,
  () => `Life update: ${faker.lorem.paragraph({ min: 1, max: 3 })}`,
];

// Comment templates
const commentTemplates = [
  () => `Great post! ${faker.lorem.sentence()}`,
  () => `I totally agree! ${faker.lorem.sentence()}`,
  () => `Thanks for sharing! ${faker.lorem.sentence()}`,
  () => `This is so true! ${faker.lorem.sentence()}`,
  () => `Love this! ${faker.lorem.sentence()}`,
  () => `Interesting perspective. ${faker.lorem.sentence()}`,
  () => `${faker.lorem.sentence()}`,
  () => `Well said! ${faker.lorem.sentence()}`,
];

// Generate meaningful post content
function generatePostContent() {
  const template = faker.helpers.arrayElement(postTemplates);
  return template();
}

// Generate meaningful comment content
function generateCommentContent() {
  const template = faker.helpers.arrayElement(commentTemplates);
  return template();
}

// Get random number with variation around average
function getRandomCount(avg, variation = 0.3) {
  const min = Math.max(1, Math.floor(avg * (1 - variation)));
  const max = Math.ceil(avg * (1 + variation));
  return faker.number.int({ min, max });
}

// Shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Statistics tracking
const stats = {
  postsCreated: 0,
  likesCreated: 0,
  commentsCreated: 0,
  followsCreated: 0,
  postsPerUser: {},
  likesPerPost: {},
  commentsPerPost: {},
  followersPerUser: {},
};

async function insertData() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.\n');

    // Verify users exist (1-1100)
    console.log('Verifying users exist...');
    const userCount = await User.count();
    if (userCount < TOTAL_USERS) {
      console.warn(`Warning: Only ${userCount} users found. Expected ${TOTAL_USERS}.`);
      console.warn('Proceeding with available users...\n');
    } else {
      console.log(`✓ Found ${userCount} users\n`);
    }

    const userIds = await User.findAll({
      attributes: ['id'],
      order: [['id', 'ASC']],
      limit: TOTAL_USERS,
    }).then(users => users.map(u => u.id));

    if (userIds.length === 0) {
      throw new Error('No users found in database. Please create users first.');
    }

    console.log('='.repeat(60));
    console.log('STARTING DATA INSERTION');
    console.log('='.repeat(60));
    console.log(`Users: ${userIds.length}`);
    console.log(`Target: ${AVG_POSTS_PER_USER} posts/user, ${AVG_LIKES_PER_POST} likes/post, ${AVG_FOLLOWERS_PER_USER} followers/user, ${AVG_COMMENTS_PER_POST} comments/post\n`);

    // Step 1: Create Posts
    console.log('Step 1: Creating posts...');
    const allPosts = [];
    
    for (const userId of userIds) {
      const numPosts = getRandomCount(AVG_POSTS_PER_USER);
      const userPosts = [];
      
      for (let i = 0; i < numPosts; i++) {
        const post = await Post.create({
          user_id: userId,
          content: generatePostContent(),
          image_urls: [], // Text only, no images
          likes_count: 0, // Will be updated by likes
          comments_count: 0, // Will be updated by comments
          created_at: faker.date.recent({ days: 30 }), // Posts from last 30 days
        });
        
        userPosts.push(post);
        allPosts.push(post);
        stats.postsCreated++;
        stats.postsPerUser[userId] = (stats.postsPerUser[userId] || 0) + 1;
      }
    }
    
    console.log(`✓ Created ${stats.postsCreated} posts\n`);

    // Step 2: Create Likes
    console.log('Step 2: Creating likes...');
    const shuffledPosts = shuffleArray(allPosts);
    
    for (const post of shuffledPosts) {
      const numLikes = getRandomCount(AVG_LIKES_PER_POST);
      const shuffledUserIds = shuffleArray(userIds.filter(id => id !== post.user_id)); // Can't like own post
      const likers = shuffledUserIds.slice(0, numLikes);
      
      for (const likerId of likers) {
        try {
          await Like.create({
            user_id: likerId,
            post_id: post.id,
            created_at: faker.date.between({ 
              from: post.created_at, 
              to: new Date() 
            }),
          });
          stats.likesCreated++;
        } catch (error) {
          // Skip if like already exists (shouldn't happen, but just in case)
          if (error.name !== 'SequelizeUniqueConstraintError') {
            throw error;
          }
        }
      }
      
      stats.likesPerPost[post.id] = numLikes;
    }
    
    console.log(`✓ Created ${stats.likesCreated} likes\n`);

    // Step 3: Create Comments
    console.log('Step 3: Creating comments...');
    
    for (const post of shuffledPosts) {
      const numComments = getRandomCount(AVG_COMMENTS_PER_POST);
      const shuffledUserIds = shuffleArray(userIds.filter(id => id !== post.user_id)); // Can comment on own post, but let's exclude for variety
      const commenters = shuffledUserIds.slice(0, numComments);
      
      for (const commenterId of commenters) {
        try {
          await Comment.create({
            user_id: commenterId,
            post_id: post.id,
            content: generateCommentContent(),
            created_at: faker.date.between({ 
              from: post.created_at, 
              to: new Date() 
            }),
          });
          stats.commentsCreated++;
        } catch (error) {
          if (error.name !== 'SequelizeValidationError') {
            throw error;
          }
        }
      }
      
      stats.commentsPerPost[post.id] = numComments;
    }
    
    console.log(`✓ Created ${stats.commentsCreated} comments\n`);

    // Step 4: Create Follows
    console.log('Step 4: Creating follows...');
    const shuffledUserIds = shuffleArray(userIds);
    
    for (const followerId of shuffledUserIds) {
      const numFollows = getRandomCount(AVG_FOLLOWERS_PER_USER);
      const availableUsers = userIds.filter(id => id !== followerId);
      const shuffledAvailable = shuffleArray(availableUsers);
      const following = shuffledAvailable.slice(0, numFollows);
      
      for (const followingId of following) {
        try {
          await Follow.create({
            follower_id: followerId,
            following_id: followingId,
            created_at: faker.date.recent({ days: 60 }), // Follows from last 60 days
          });
          stats.followsCreated++;
          stats.followersPerUser[followingId] = (stats.followersPerUser[followingId] || 0) + 1;
        } catch (error) {
          // Skip if follow relationship already exists
          if (error.name !== 'SequelizeUniqueConstraintError') {
            throw error;
          }
        }
      }
    }
    
    console.log(`✓ Created ${stats.followsCreated} follows\n`);

    // Calculate and display statistics
    console.log('='.repeat(60));
    console.log('INSERTION COMPLETE - STATISTICS');
    console.log('='.repeat(60));
    
    const avgPostsPerUser = stats.postsCreated / userIds.length;
    const avgLikesPerPost = stats.postsCreated > 0 ? stats.likesCreated / stats.postsCreated : 0;
    const avgCommentsPerPost = stats.postsCreated > 0 ? stats.commentsCreated / stats.postsCreated : 0;
    // Calculate average followers per user from the actual followers count
    const followersPerUserValues = Object.values(stats.followersPerUser);
    const avgFollowersPerUser = followersPerUserValues.length > 0 
      ? followersPerUserValues.reduce((a, b) => a + b, 0) / userIds.length 
      : 0;
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Users: ${userIds.length}`);
    console.log(`   Total Posts: ${stats.postsCreated}`);
    console.log(`   Total Likes: ${stats.likesCreated}`);
    console.log(`   Total Comments: ${stats.commentsCreated}`);
    console.log(`   Total Follows: ${stats.followsCreated}`);
    
    console.log(`\n📈 AVERAGES:`);
    console.log(`   Posts per User: ${avgPostsPerUser.toFixed(2)} (target: ${AVG_POSTS_PER_USER})`);
    console.log(`   Likes per Post: ${avgLikesPerPost.toFixed(2)} (target: ${AVG_LIKES_PER_POST})`);
    console.log(`   Comments per Post: ${avgCommentsPerPost.toFixed(2)} (target: ${AVG_COMMENTS_PER_POST})`);
    console.log(`   Followers per User: ${avgFollowersPerUser.toFixed(2)} (target: ${AVG_FOLLOWERS_PER_USER})`);
    
    // Distribution stats
    const postsPerUserValues = Object.values(stats.postsPerUser);
    const likesPerPostValues = Object.values(stats.likesPerPost);
    const commentsPerPostValues = Object.values(stats.commentsPerPost);
    // followersPerUserValues already declared above
    
    console.log(`\n📊 DISTRIBUTION:`);
    if (postsPerUserValues.length > 0) {
      console.log(`   Posts per User - Min: ${Math.min(...postsPerUserValues)}, Max: ${Math.max(...postsPerUserValues)}`);
    }
    if (likesPerPostValues.length > 0) {
      console.log(`   Likes per Post - Min: ${Math.min(...likesPerPostValues)}, Max: ${Math.max(...likesPerPostValues)}`);
    }
    if (commentsPerPostValues.length > 0) {
      console.log(`   Comments per Post - Min: ${Math.min(...commentsPerPostValues)}, Max: ${Math.max(...commentsPerPostValues)}`);
    }
    if (followersPerUserValues.length > 0) {
      console.log(`   Followers per User - Min: ${Math.min(...followersPerUserValues)}, Max: ${Math.max(...followersPerUserValues)}`);
    }
    
    console.log('\n✅ All data inserted successfully!');
    
  } catch (error) {
    console.error('❌ Error inserting data:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the script
if (require.main === module) {
  insertData()
    .then(() => {
      console.log('\n✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { insertData };

