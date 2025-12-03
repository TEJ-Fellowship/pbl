const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Generate comments data and write to CSV
const generateCommentsToCSV = () => {
  const csvPath = path.join(__dirname, '../dummyData/comment.csv');
  const totalPosts = 200;
  const totalUsers = 433;
  const avgCommentsPerPost = 3.5; // Average between 3-4
  
  // Array to store generated comments
  const comments = [];
  
  // Generate comments for posts (average 3-4 per post, but not all posts get comments)
  for (let postId = 1; postId <= totalPosts; postId++) {
    // 70% of posts get comments (not all posts need comments)
    if (Math.random() < 0.7) {
      // Each post that gets comments has 1-4 comments (average around 3-4)
      const numComments = Math.floor(Math.random() * 4) + 1; // 1-4 comments
      
      // Track which users have commented on this post (avoid duplicates)
      const postCommenters = new Set();
      
      for (let i = 0; i < numComments; i++) {
        let userId;
        let attempts = 0;
        
        // Find a user who hasn't commented on this post yet
        do {
          userId = Math.floor(Math.random() * totalUsers) + 1;
          attempts++;
          if (attempts > 100) break; // Safety break
        } while (postCommenters.has(userId));
        
        if (!postCommenters.has(userId)) {
          postCommenters.add(userId);
          
          // Generate realistic comment content
          const content = faker.lorem.sentence({ min: 5, max: 15 });
          
          comments.push({
            post_id: postId,
            user_id: userId,
            content: content.replace(/"/g, '""') // Escape quotes for CSV
          });
        }
      }
    }
  }
  
  // Shuffle comments to randomize order
  for (let i = comments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [comments[i], comments[j]] = [comments[j], comments[i]];
  }
  
  // Write to CSV file with header
  const csvContent = 'post_id,user_id,content\n' + 
    comments.map(c => `${c.post_id},${c.user_id},"${c.content}"`).join('\n');
  
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  
  const postsWithComments = new Set(comments.map(c => c.post_id)).size;
  console.log(`Generated ${comments.length} comments and saved to ${csvPath}`);
  console.log(`Posts with comments: ${postsWithComments} out of ${totalPosts}`);
  console.log(`Average comments per post (with comments): ${(comments.length / postsWithComments).toFixed(2)}`);
};

// Generate comments when module is loaded
generateCommentsToCSV();

// Export function for Artillery to use during tests
module.exports = {
  generateComment: function(context, events, done) {
    // Generate comment content
    const content = faker.lorem.sentence({ min: 5, max: 15 });
    context.vars.content = content;
    
    return done();
  }
};

