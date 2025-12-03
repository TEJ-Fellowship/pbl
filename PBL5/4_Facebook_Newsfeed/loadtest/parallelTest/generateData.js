const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Set faker locale
faker.locale = 'en';

// Configuration
const TOTAL_USERS = 1200;
const TOTAL_POSTS = 9000;
const REQUESTS_PER_ROUTE = 5; // 5 requests for each route type

console.log('📊 Generating combined test data for parallel testing...');
console.log(`Total Users in DB: ${TOTAL_USERS}`);
console.log(`Total Posts in DB: ${TOTAL_POSTS}`);
console.log(`\nGenerating ${REQUESTS_PER_ROUTE} requests for each route:`);
console.log(`  - User creation`);
console.log(`  - Post creation`);
console.log(`  - Likes`);
console.log(`  - Comments`);
console.log(`  - Feed requests`);

// Generate username
const generateUsername = () => {
  const firstName = faker.person.firstName().toLowerCase();
  const lastName = faker.person.lastName().toLowerCase();
  const randomNum = faker.number.int({ min: 100, max: 999 });
  return `${firstName}_${lastName}_${randomNum}`.substring(0, 50);
};

// Generate post content
const generatePostContent = () => {
  const postTypes = [
    () => `Just finished working on something interesting. ${faker.lorem.sentence()}`,
    () => `Having a great day! ${faker.lorem.sentence()}`,
    () => `Can't believe it's already ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}. ${faker.lorem.sentence()}`,
    () => `Thinking about ${faker.word.noun()} today. ${faker.lorem.sentence()}`,
    () => `What do you all think about ${faker.word.noun()}? ${faker.lorem.sentence()}`,
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
  ];
  const randomType = commentTypes[Math.floor(Math.random() * commentTypes.length)];
  return randomType();
};

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Generate combined CSV for parallel testing
const generateCombinedCSV = () => {
  const csvPath = path.join(dataDir, 'all_data.csv');
  const allData = [];
  
  // Generate enough rows for all scenarios (5 requests per route = 5 rows minimum)
  // We'll generate 5 rows, each with all fields needed
  for (let i = 0; i < REQUESTS_PER_ROUTE; i++) {
    const username = generateUsername();
    const userId = Math.floor(Math.random() * TOTAL_USERS) + 1;
    const postId = Math.floor(Math.random() * TOTAL_POSTS) + 1;
    const postContent = generatePostContent().replace(/\n/g, ' ').replace(/"/g, '""');
    const commentContent = generateCommentContent().replace(/\n/g, ' ').replace(/"/g, '""');
    
    allData.push({
      username,
      user_id: userId,
      post_id: postId,
      post_content: postContent,
      comment_content: commentContent
    });
  }
  
  // CSV format: username,user_id,post_id,post_content,comment_content
  const csvContent = 'username,user_id,post_id,post_content,comment_content\n' + 
    allData.map(d => `"${d.username}",${d.user_id},${d.post_id},"${d.post_content}","${d.comment_content}"`).join('\n');
  
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`\n✅ Generated ${allData.length} combined data rows → ${csvPath}`);
  console.log(`\n📊 Sample data:`);
  console.log(`   Username range: ${allData[0].username} - ${allData[allData.length - 1].username}`);
  console.log(`   User ID range: ${Math.min(...allData.map(d => d.user_id))} - ${Math.max(...allData.map(d => d.user_id))}`);
  console.log(`   Post ID range: ${Math.min(...allData.map(d => d.post_id))} - ${Math.max(...allData.map(d => d.post_id))}`);
};

// Generate all CSV files
console.log('\n📝 Generating combined CSV file...\n');
generateCombinedCSV();

console.log('\n✨ Combined test data generated successfully!');
console.log(`\n📁 File created: ${dataDir}/all_data.csv`);
console.log('\n💡 This CSV contains all fields needed for parallel testing:');
console.log('   - username (for user creation)');
console.log('   - user_id (for posts, likes, comments, feed)');
console.log('   - post_id (for likes, comments)');
console.log('   - post_content (for post creation)');
console.log('   - comment_content (for comments)');

