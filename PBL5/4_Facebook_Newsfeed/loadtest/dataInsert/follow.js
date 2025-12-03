const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Generate follows data and write to CSV
// BATCH 2: Users 600-1200, generating 15,000 follows (600 users × 25 follows each)
const generateFollowsToCSV = () => {
  const csvPath = path.join(__dirname, '../dummyData/follow.csv');
  const totalUsers = 1200; // Total users in system
  const batchStartUser = 600; // Batch 2: start from user 600
  const batchEndUser = 1200; // Batch 2: end at user 1200
  const batchUsers = batchEndUser - batchStartUser + 1; // 600 users
  const avgFollowsPerUser = 25; // Average 25 follows per user
  
  // Array to store generated follows
  const follows = [];
  const followSet = new Set(); // To prevent duplicate follows (follower_id, following_id)
  
  // Generate follows for batch users only (users 600-1200)
  for (let followerId = batchStartUser; followerId <= batchEndUser; followerId++) {
    // Create a pool of users this user can follow (all users except themselves)
    const availableUsers = [];
    for (let i = 1; i <= totalUsers; i++) {
      if (i !== followerId) {
        availableUsers.push(i);
      }
    }
    
    // Shuffle the available users to randomize selection
    for (let i = availableUsers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableUsers[i], availableUsers[j]] = [availableUsers[j], availableUsers[i]];
    }
    
    // Each user follows exactly 25 other users
    const numFollows = 25;
    let followsAdded = 0;
    
    for (let i = 0; i < availableUsers.length && followsAdded < numFollows; i++) {
      const followingId = availableUsers[i];
      const followKey = `${followerId}_${followingId}`;
      
      // Only add if not already in the set (prevents duplicates across users)
      if (!followSet.has(followKey)) {
        followSet.add(followKey);
        follows.push({
          follower_id: followerId,
          following_id: followingId
        });
        followsAdded++;
      }
    }
    
    // If we couldn't get 25 follows (shouldn't happen with 1200 users), log warning
    if (followsAdded < numFollows) {
      console.warn(`Warning: User ${followerId} only has ${followsAdded} follows (target: ${numFollows})`);
    }
  }
  
  // Write to CSV file with header (follows are already in incremental order by follower_id)
  const csvContent = 'follower_id,following_id\n' + 
    follows.map(f => `${f.follower_id},${f.following_id}`).join('\n');
  
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  
  console.log(`Batch 2: Generated ${follows.length} follows for users ${batchStartUser}-${batchEndUser}`);
  console.log(`Saved to ${csvPath}`);
  console.log(`Average follows per user: ${(follows.length / batchUsers).toFixed(2)}`);
  console.log(`Expected: ${batchUsers * 25} follows`);
};

// Generate follows when module is loaded
generateFollowsToCSV();

// Export function for Artillery to use during tests
module.exports = {
  generateFollow: function(context, events, done) {
    // This function is called during test execution
    // The actual follower_id and following_id come from CSV
    return done();
  }
};

