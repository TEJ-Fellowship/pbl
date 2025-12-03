const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Generate likes data and write to CSV
// 15000 likes total, randomly distributed across posts 1-9714, users 1-1200
// CSV sorted by user_id (incrementing), then post_id (incrementing)
const generateLikesToCSV = () => {
  const csvPath = path.join(__dirname, '../dummyData/like.csv');
  const totalUsers = 1200; // Users 1-1200
  const totalPosts = 9714; // Posts 1-9714
  const totalLikes = 15000; // Total likes to generate (~1.54 likes per post on average)
  
  // Array to store generated likes
  const likes = [];
  const likeSet = new Set(); // To prevent duplicate likes (user_id, post_id)
  
  // Generate 15000 likes randomly distributed across posts 1-9714
  let likesGenerated = 0;
  let attempts = 0;
  const maxAttempts = totalLikes * 10; // Safety limit
  
  while (likesGenerated < totalLikes && attempts < maxAttempts) {
    const userId = Math.floor(Math.random() * totalUsers) + 1; // Random user 1-1200
    const postId = Math.floor(Math.random() * totalPosts) + 1; // Random post 1-9714
    const likeKey = `${userId}_${postId}`;
    
    // Only add if not duplicate
    if (!likeSet.has(likeKey)) {
      likeSet.add(likeKey);
      likes.push({
        user_id: userId,
        post_id: postId
      });
      likesGenerated++;
    }
    attempts++;
  }
  
  // Sort by user_id (ascending), then post_id (ascending) for increment order
  likes.sort((a, b) => {
    if (a.user_id !== b.user_id) {
      return a.user_id - b.user_id;
    }
    return a.post_id - b.post_id;
  });
  
  // Write to CSV file with header
  const csvContent = 'user_id,post_id\n' + 
    likes.map(l => `${l.user_id},${l.post_id}`).join('\n');
  
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  
  console.log(`Generated ${likes.length} likes and saved to ${csvPath}`);
  console.log(`Total users: ${totalUsers} (1-${totalUsers})`);
  console.log(`Total posts: ${totalPosts} (1-${totalPosts})`);
  console.log(`Average likes per user: ${(likes.length / totalUsers).toFixed(2)}`);
  console.log(`Average likes per post: ${(likes.length / totalPosts).toFixed(2)}`);
  console.log(`CSV sorted by user_id (incrementing), then post_id (incrementing)`);
};

// Generate likes when module is loaded
generateLikesToCSV();

// Export function for Artillery to use during tests
module.exports = {
  generateLike: function(context, events, done) {
    // Ensure user_id and post_id are numbers (CSV values might be strings)
    if (context.vars.user_id) {
      context.vars.user_id = parseInt(context.vars.user_id, 10);
    }
    if (context.vars.post_id) {
      context.vars.post_id = parseInt(context.vars.post_id, 10);
    }
    return done();
  }
};

