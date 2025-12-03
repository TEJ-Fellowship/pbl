const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Set faker locale to English
faker.locale = 'en';

// Generate meaningful English post content
const generatePostContent = () => {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const randomWeekday = weekdays[Math.floor(Math.random() * weekdays.length)];
  
  const postTypes = [
    // Personal updates
    () => `Just finished working on something interesting. ${faker.lorem.sentence()}`,
    () => `Having a great day! ${faker.lorem.sentence()}`,
    () => `Can't believe it's already ${randomWeekday}. ${faker.lorem.sentence()}`,
    () => `Just had the best ${faker.commerce.product()} ever! ${faker.lorem.sentence()}`,
    // Thoughts and opinions
    () => `Thinking about ${faker.word.noun()} today. ${faker.lorem.sentence()}`,
    () => `What do you all think about ${faker.word.noun()}? ${faker.lorem.sentence()}`,
    () => `I've been learning about ${faker.word.noun()} and it's fascinating. ${faker.lorem.sentence()}`,
    // Questions
    () => `Anyone else interested in ${faker.word.noun()}? ${faker.lorem.sentence()}`,
    () => `What's everyone up to this ${randomWeekday}? ${faker.lorem.sentence()}`,
    // Experiences
    () => `Just experienced something ${faker.word.adjective()}. ${faker.lorem.sentence()}`,
    () => `Went to ${faker.location.city()} and it was amazing! ${faker.lorem.sentence()}`,
    () => `Trying out ${faker.commerce.productName()} today. ${faker.lorem.sentence()}`,
    // Motivational
    () => `Remember: ${faker.lorem.sentence()}`,
    () => `Today's goal: accomplish something great. ${faker.lorem.sentence()}`,
    // Simple statements
    () => faker.lorem.sentences({ min: 2, max: 4 }),
    () => `${faker.lorem.sentence()} ${faker.lorem.sentence()}`,
    // More variety
    () => `Feeling ${faker.word.adjective()} today. ${faker.lorem.sentence()}`,
    () => `Just discovered ${faker.word.noun()}. ${faker.lorem.sentence()}`,
    () => `Working on a new project involving ${faker.word.noun()}. ${faker.lorem.sentence()}`,
  ];
  
  const randomType = postTypes[Math.floor(Math.random() * postTypes.length)];
  return randomType();
};

// Generate posts data and write to CSV
const generatePostsToCSV = () => {
  const csvPath = path.join(__dirname, '../dummyData/post.csv');
  const startUserId = 600; // Batch 2: Users from 600-1200
  const endUserId = 1200;
  const totalUsers = endUserId - startUserId + 1; // 600 users (600-1200)
  const postsPerUser = 25; // Each user creates exactly 25 posts
  const totalPosts = totalUsers * postsPerUser; // 15,000 posts total
  
  // Array to store generated posts
  const posts = [];
  
  // Track posts per user for verification
  const postsPerUserCount = new Array(totalUsers).fill(0);
  
  // Generate exactly 25 posts for each user (600-1200) in sequential order
  // User 600: 25 posts, User 601: 25 posts, User 602: 25 posts, etc.
  for (let userId = startUserId; userId <= endUserId; userId++) {
    for (let i = 0; i < postsPerUser; i++) {
      const content = generatePostContent();
      posts.push({
        user_id: userId,
        content: content.replace(/\n/g, ' ').replace(/"/g, '""') // Escape quotes for CSV
      });
      postsPerUserCount[userId - startUserId]++;
    }
  }
  
  // Posts are already in sequential order: user 600's 25 posts, then user 601's 25 posts, etc.
  // No shuffling needed - CSV will be processed in sequence by YML
  
  // Write to CSV file with header
  const csvContent = 'user_id,content\n' + 
    posts.map(p => `${p.user_id},"${p.content}"`).join('\n');
  
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  
  const usersWithPosts = postsPerUserCount.filter(count => count > 0).length;
  const maxPosts = Math.max(...postsPerUserCount);
  const minPosts = Math.min(...postsPerUserCount);
  const avgPosts = (posts.length / usersWithPosts).toFixed(2);
  
  console.log(`Generated ${posts.length} posts and saved to ${csvPath}`);
  console.log(`Users with posts: ${usersWithPosts} out of ${totalUsers} (users ${startUserId}-${endUserId})`);
  console.log(`Posts per user - Min: ${minPosts}, Max: ${maxPosts}, Avg: ${avgPosts}`);
  console.log(`Expected: Each user (${startUserId}-${endUserId}) has exactly ${postsPerUser} posts`);
};

// Generate posts when module is loaded
generatePostsToCSV();

// Export function for Artillery to use during tests
module.exports = {
  generatePost: function(context, events, done) {
    // Generate meaningful English post content
    const content = generatePostContent();
    context.vars.content = content;
    context.vars.image_urls = []; // No images, text only
    
    return done();
  },
  parseImageUrls: function(context, events, done) {
    // Always return empty array (no images)
    context.vars.parsedImageUrls = [];
    return done();
  }
};

