const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Set faker locale
faker.locale = 'en';

// ============================================================================
// REALISTIC LOAD TESTING CONFIGURATION
// Based on real-world social media patterns for 1200 total users
// ============================================================================

// User Base Configuration
const TOTAL_USERS = 1200;
const ACTIVE_USERS = 120; // 10% active users (realistic for social media platforms)
const TOTAL_POSTS = 6000; // Approximate number of existing posts in database

// Test Duration & Load Calculation
const TEST_DURATION_SECONDS = 1020; // 17 minutes total test duration
// Realistic RPS calculation for 120 active users:
// - Normal: 120 users ÷ 25 seconds = ~5 req/s
// - Active: 120 users ÷ 12 seconds = ~10 req/s  
// - Peak: 120 users ÷ 9 seconds = ~13 req/s
// - Stress: up to 30 req/s to find breaking point
// Average across all phases: ~10 req/s
const AVERAGE_REQUESTS_PER_SECOND = 10; // Realistic average RPS
const TOTAL_REQUESTS = TEST_DURATION_SECONDS * AVERAGE_REQUESTS_PER_SECOND; // ~10,200 requests

// Realistic Activity Distribution (based on real social media analytics)
// Source: Typical social media engagement patterns
const FEED_PERCENTAGE = 65; // 65% feed requests (most common - users browsing/reading)
const POST_PERCENTAGE = 12; // 12% post creation (only 5-10% of users actively post)
const LIKE_PERCENTAGE = 18; // 18% likes (common quick interaction)
const COMMENT_PERCENTAGE = 5; // 5% comments (least common, requires more engagement)

// Calculate number of each activity type
const feedRequests = Math.floor(TOTAL_REQUESTS * FEED_PERCENTAGE / 100);
const postRequests = Math.floor(TOTAL_REQUESTS * POST_PERCENTAGE / 100);
const likeRequests = Math.floor(TOTAL_REQUESTS * LIKE_PERCENTAGE / 100);
const commentRequests = TOTAL_REQUESTS - feedRequests - postRequests - likeRequests;

console.log('📊 Generating test data for scaling test...');
console.log(`Total Users: ${TOTAL_USERS}`);
console.log(`Active Users: ${ACTIVE_USERS} (10%)`);
console.log(`Total Requests: ${TOTAL_REQUESTS}`);
console.log(`\nActivity Distribution:`);
console.log(`  Feed Requests: ${feedRequests} (${FEED_PERCENTAGE}%)`);
console.log(`  Post Creation: ${postRequests} (${POST_PERCENTAGE}%)`);
console.log(`  Likes: ${likeRequests} (${LIKE_PERCENTAGE}%)`);
console.log(`  Comments: ${commentRequests} (${COMMENT_PERCENTAGE}%)`);

// Generate post content
const generatePostContent = () => {
  const postTypes = [
    () => `Just finished working on something interesting. ${faker.lorem.sentence()}`,
    () => `Having a great day! ${faker.lorem.sentence()}`,
    () => `Can't believe it's already ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}. ${faker.lorem.sentence()}`,
    () => `Thinking about ${faker.word.noun()} today. ${faker.lorem.sentence()}`,
    () => `What do you all think about ${faker.word.noun()}? ${faker.lorem.sentence()}`,
    () => `Just experienced something ${faker.word.adjective()}. ${faker.lorem.sentence()}`,
    () => `Went to ${faker.location.city()} and it was amazing! ${faker.lorem.sentence()}`,
    () => faker.lorem.sentences({ min: 2, max: 4 }),
  ];
  const randomType = postTypes[Math.floor(Math.random() * postTypes.length)];
  return randomType();
};

// Generate comment content
const generateCommentContent = () => {
  const commentTypes = [
    () => `Great post! ${faker.lorem.sentence()}`,
    () => `I agree! ${faker.lorem.sentence()}`,
    () => `Interesting perspective. ${faker.lorem.sentence()}`,
    () => `Thanks for sharing! ${faker.lorem.sentence()}`,
    () => `Nice! ${faker.lorem.sentence()}`,
    () => faker.lorem.sentence(),
  ];
  const randomType = commentTypes[Math.floor(Math.random() * commentTypes.length)];
  return randomType();
};

// Select 120 active users from 1-1200
const activeUserPool = [];
const userSet = new Set();
while (activeUserPool.length < ACTIVE_USERS) {
  const userId = Math.floor(Math.random() * TOTAL_USERS) + 1;
  if (!userSet.has(userId)) {
    userSet.add(userId);
    activeUserPool.push(userId);
  }
}
activeUserPool.sort((a, b) => a - b);

console.log(`\n✅ Selected ${activeUserPool.length} active users: ${activeUserPool.slice(0, 10).join(', ')}...`);

// Generate feed requests CSV
const generateFeedRequests = () => {
  const csvPath = path.join(__dirname, 'data', 'feed_requests.csv');
  const feedData = [];
  
  for (let i = 0; i < feedRequests; i++) {
    const randomUser = activeUserPool[Math.floor(Math.random() * activeUserPool.length)];
    // Ensure user_id is a valid integer
    const userId = parseInt(randomUser, 10);
    if (isNaN(userId) || userId < 1 || userId > TOTAL_USERS) {
      console.warn(`⚠️  Invalid user_id generated: ${randomUser}, skipping...`);
      i--; // Retry
      continue;
    }
    feedData.push({ user_id: userId });
  }
  
  // Verify all user IDs are valid
  const invalidIds = feedData.filter(f => isNaN(f.user_id) || f.user_id < 1 || f.user_id > TOTAL_USERS);
  if (invalidIds.length > 0) {
    console.error(`❌ Found ${invalidIds.length} invalid user IDs!`);
  }
  
  const csvContent = 'user_id\n' + feedData.map(f => f.user_id).join('\n');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`✅ Generated ${feedData.length} feed requests → ${csvPath}`);
  console.log(`   User ID range: ${Math.min(...feedData.map(f => f.user_id))} - ${Math.max(...feedData.map(f => f.user_id))}`);
};

// Generate post creation CSV
const generatePosts = () => {
  const csvPath = path.join(__dirname, 'data', 'posts.csv');
  const postData = [];
  
  for (let i = 0; i < postRequests; i++) {
    const randomUser = activeUserPool[Math.floor(Math.random() * activeUserPool.length)];
    const content = generatePostContent().replace(/\n/g, ' ').replace(/"/g, '""');
    postData.push({ user_id: randomUser, content });
  }
  
  const csvContent = 'user_id,content\n' + 
    postData.map(p => `${p.user_id},"${p.content}"`).join('\n');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`✅ Generated ${postRequests} post creations → ${csvPath}`);
};

// Generate likes CSV
const generateLikes = () => {
  const csvPath = path.join(__dirname, 'data', 'likes.csv');
  const likeData = [];
  const likeSet = new Set();
  
  for (let i = 0; i < likeRequests; i++) {
    const randomUser = activeUserPool[Math.floor(Math.random() * activeUserPool.length)];
    const randomPostId = Math.floor(Math.random() * TOTAL_POSTS) + 1;
    const likeKey = `${randomUser}_${randomPostId}`;
    
    // Avoid duplicate likes (same user liking same post)
    if (!likeSet.has(likeKey)) {
      likeSet.add(likeKey);
      likeData.push({ user_id: randomUser, post_id: randomPostId });
    } else {
      // Retry with different post
      i--;
    }
  }
  
  const csvContent = 'user_id,post_id\n' + 
    likeData.map(l => `${l.user_id},${l.post_id}`).join('\n');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`✅ Generated ${likeData.length} likes → ${csvPath}`);
};

// Generate comments CSV
const generateComments = () => {
  const csvPath = path.join(__dirname, 'data', 'comments.csv');
  const commentData = [];
  
  for (let i = 0; i < commentRequests; i++) {
    const randomUser = activeUserPool[Math.floor(Math.random() * activeUserPool.length)];
    const randomPostId = Math.floor(Math.random() * TOTAL_POSTS) + 1;
    const content = generateCommentContent().replace(/\n/g, ' ').replace(/"/g, '""');
    commentData.push({ user_id: randomUser, post_id: randomPostId, content });
  }
  
  const csvContent = 'user_id,post_id,content\n' + 
    commentData.map(c => `${c.user_id},${c.post_id},"${c.content}"`).join('\n');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`✅ Generated ${commentRequests} comments → ${csvPath}`);
};

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Generate all CSV files
console.log('\n📝 Generating CSV files...\n');
generateFeedRequests();
generatePosts();
generateLikes();
generateComments();

console.log('\n✨ All test data generated successfully!');
console.log(`\n📁 Files created in: ${dataDir}`);
console.log('\n📊 Summary:');
console.log(`   - feed_requests.csv: ${feedRequests} requests`);
console.log(`   - posts.csv: ${postRequests} requests`);
console.log(`   - likes.csv: ${likeRequests} requests`);
console.log(`   - comments.csv: ${commentRequests} requests`);
console.log(`   - Total: ${feedRequests + postRequests + likeRequests + commentRequests} requests`);

