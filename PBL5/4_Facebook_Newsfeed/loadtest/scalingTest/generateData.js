const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Set faker locale
faker.locale = 'en';

// ============================================================================
// REALISTIC SCALING TEST CONFIGURATION
// Based on real-world social media patterns
// ============================================================================

// User Base Configuration
const TOTAL_USERS = 1100;
const ACTIVE_USERS = 400; 
const TOTAL_POSTS = 9700; // Existing posts in database (1-9700)

// Test Configuration - Scaling to 200 req/sec peak
// Estimated total requests for ~15 minute test with peak at 200 req/s
// Average across all phases: ~100 req/s
const TEST_DURATION_SECONDS = 900; // 15 minutes total
const AVERAGE_REQUESTS_PER_SECOND = 100;
const TOTAL_REQUESTS = TEST_DURATION_SECONDS * AVERAGE_REQUESTS_PER_SECOND; // ~90,000 requests

// Realistic Activity Distribution (NO USER CREATION)
const FEED_PERCENTAGE = 65; // 65% feed requests (most common)
const POST_PERCENTAGE = 12; // 12% post creation
const LIKE_PERCENTAGE = 18; // 18% likes
const COMMENT_PERCENTAGE = 5; // 5% comments
// Total: 100% (no user creation)

// Calculate number of each activity type
const feedRequests = Math.floor(TOTAL_REQUESTS * FEED_PERCENTAGE / 100);
const postRequests = Math.floor(TOTAL_REQUESTS * POST_PERCENTAGE / 100);
const likeRequests = Math.floor(TOTAL_REQUESTS * LIKE_PERCENTAGE / 100);
const commentRequests = TOTAL_REQUESTS - feedRequests - postRequests - likeRequests;

console.log('📊 Generating combined test data for scaling test...');
console.log(`Total Users in DB: ${TOTAL_USERS}`);
console.log(`Active Users: ${ACTIVE_USERS} (20% of ${TOTAL_USERS})`);
console.log(`Total Posts in DB: ${TOTAL_POSTS}`);
console.log(`Total Requests: ${TOTAL_REQUESTS.toLocaleString()}`);
console.log(`\nActivity Distribution (NO USER CREATION):`);
console.log(`  Feed Requests: ${feedRequests.toLocaleString()} (${FEED_PERCENTAGE}%)`);
console.log(`  Post Creation: ${postRequests.toLocaleString()} (${POST_PERCENTAGE}%)`);
console.log(`  Likes: ${likeRequests.toLocaleString()} (${LIKE_PERCENTAGE}%)`);
console.log(`  Comments: ${commentRequests.toLocaleString()} (${COMMENT_PERCENTAGE}%)`);

// Generate post content (meaningful full text)
const generatePostContent = () => {
  const postTypes = [
    () => `Just finished working on something interesting. ${faker.lorem.sentences({ min: 2, max: 3 })}`,
    () => `Having a great day! ${faker.lorem.sentences({ min: 2, max: 3 })}`,
    () => `Can't believe it's already ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}. ${faker.lorem.sentences({ min: 2, max: 3 })}`,
    () => `Thinking about ${faker.word.noun()} today. ${faker.lorem.sentences({ min: 2, max: 3 })}`,
    () => `What do you all think about ${faker.word.noun()}? ${faker.lorem.sentences({ min: 2, max: 3 })}`,
    () => `Just experienced something ${faker.word.adjective()}. ${faker.lorem.sentences({ min: 2, max: 3 })}`,
    () => `Went to ${faker.location.city()} and it was amazing! ${faker.lorem.sentences({ min: 2, max: 3 })}`,
    () => faker.lorem.sentences({ min: 3, max: 5 }), // Full meaningful text
  ];
  const randomType = postTypes[Math.floor(Math.random() * postTypes.length)];
  return randomType();
};

// Generate comment content (very short comments)
const generateCommentContent = () => {
  const commentTypes = [
    () => `Great post!`,
    () => `I agree!`,
    () => `Interesting!`,
    () => `Thanks for sharing!`,
    () => `Nice!`,
    () => `Love this!`,
    () => `So true!`,
    () => `Amazing!`,
    () => `Well said!`,
    () => faker.lorem.words({ min: 3, max: 8 }), // Very short: 3-8 words
  ];
  const randomType = commentTypes[Math.floor(Math.random() * commentTypes.length)];
  return randomType();
};

// Select 240 active users from 1-1200
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

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Generate combined CSV for all routes
const generateCombinedCSV = () => {
  const csvPath = path.join(dataDir, 'all_data.csv');
  const allData = [];
  
  // Generate data for each activity type
  console.log('\n📝 Generating combined CSV data...\n');
  
  // Feed requests (65%) - ALL fields filled: user_id (random 1-1200), post_id (random 1-9700), post_content (full text), comment_content (short)
  for (let i = 0; i < feedRequests; i++) {
    const userId = Math.floor(Math.random() * TOTAL_USERS) + 1; // Random user 1-1200
    const postId = Math.floor(Math.random() * TOTAL_POSTS) + 1; // Random post 1-9700
    const postContent = generatePostContent().replace(/\n/g, ' ').replace(/"/g, '""'); // Full meaningful text
    const commentContent = generateCommentContent().replace(/\n/g, ' ').replace(/"/g, '""'); // Very short comment
    allData.push({
      user_id: userId,
      post_id: postId,
      post_content: postContent,
      comment_content: commentContent
    });
  }
  
  // Post creations (12%) - ALL fields filled
  for (let i = 0; i < postRequests; i++) {
    const userId = Math.floor(Math.random() * TOTAL_USERS) + 1; // Random user 1-1200
    const postId = Math.floor(Math.random() * TOTAL_POSTS) + 1; // Random post 1-9700
    const postContent = generatePostContent().replace(/\n/g, ' ').replace(/"/g, '""'); // Full meaningful text
    const commentContent = generateCommentContent().replace(/\n/g, ' ').replace(/"/g, '""'); // Very short comment
    allData.push({
      user_id: userId,
      post_id: postId,
      post_content: postContent,
      comment_content: commentContent
    });
  }
  
  // Likes (18%) - ALL fields filled
  const likeSet = new Set();
  for (let i = 0; i < likeRequests; i++) {
    const userId = Math.floor(Math.random() * TOTAL_USERS) + 1; // Random user 1-1200
    const postId = Math.floor(Math.random() * TOTAL_POSTS) + 1; // Random post 1-9700
    const likeKey = `${userId}_${postId}`;
    const postContent = generatePostContent().replace(/\n/g, ' ').replace(/"/g, '""'); // Full meaningful text
    const commentContent = generateCommentContent().replace(/\n/g, ' ').replace(/"/g, '""'); // Very short comment
    
    if (!likeSet.has(likeKey)) {
      likeSet.add(likeKey);
      allData.push({
        user_id: userId,
        post_id: postId,
        post_content: postContent,
        comment_content: commentContent
      });
    } else {
      i--; // Retry
    }
  }
  
  // Comments (5%) - ALL fields filled
  for (let i = 0; i < commentRequests; i++) {
    const userId = Math.floor(Math.random() * TOTAL_USERS) + 1; // Random user 1-1200
    const postId = Math.floor(Math.random() * TOTAL_POSTS) + 1; // Random post 1-9700
    const postContent = generatePostContent().replace(/\n/g, ' ').replace(/"/g, '""'); // Full meaningful text
    const commentContent = generateCommentContent().replace(/\n/g, ' ').replace(/"/g, '""'); // Very short comment
    allData.push({
      user_id: userId,
      post_id: postId,
      post_content: postContent,
      comment_content: commentContent
    });
  }
  
  // Shuffle the data to mix all activity types
  for (let i = allData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allData[i], allData[j]] = [allData[j], allData[i]];
  }
  
  // CSV format: user_id,post_id,post_content,comment_content
  // ALL fields are always filled - no empty fields
  const csvContent = 'user_id,post_id,post_content,comment_content\n' + 
    allData.map(d => {
      // All fields are always present and filled
      const postContent = `"${d.post_content}"`;
      const commentContent = `"${d.comment_content}"`;
      return `${d.user_id},${d.post_id},${postContent},${commentContent}`;
    }).join('\n');
  
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`✅ Generated ${allData.length.toLocaleString()} combined data rows → ${csvPath}`);
  console.log(`\n📊 Data Summary:`);
  console.log(`   User ID range: ${Math.min(...allData.map(d => d.user_id))} - ${Math.max(...allData.map(d => d.user_id))} (random 1-${TOTAL_USERS})`);
  console.log(`   Post ID range: ${Math.min(...allData.map(d => d.post_id))} - ${Math.max(...allData.map(d => d.post_id))} (random 1-${TOTAL_POSTS})`);
  console.log(`   ✅ ALL rows have ALL fields filled:`);
  console.log(`      - user_id: ${allData.length.toLocaleString()} rows`);
  console.log(`      - post_id: ${allData.length.toLocaleString()} rows`);
  console.log(`      - post_content: ${allData.length.toLocaleString()} rows (full meaningful text)`);
  console.log(`      - comment_content: ${allData.length.toLocaleString()} rows (very short comments)`);
};

// Generate combined CSV
generateCombinedCSV();

console.log('\n✨ Combined test data generated successfully!');
console.log(`\n📁 File created: ${dataDir}/all_data.csv`);
console.log('\n💡 CSV contains all fields for parallel testing:');
console.log('   - user_id (for all routes)');
console.log('   - post_id (for likes, comments)');
console.log('   - post_content (for post creation)');
console.log('   - comment_content (for comments)');

