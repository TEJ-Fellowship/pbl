const { Follow } = require("../models/index");
const sequelize = require("../config/database");

// Configuration
const TARGET_USER_ID = 22; // User 22 - the most followed account
const MIN_USER_ID = 1;
const MAX_USER_ID = 1100;

/**
 * Script to make user 22 the most followed account
 * Every user (1-1100) will follow user 22
 * Checks if follow relationship already exists before creating
 */
async function makeUser22MostFollowed() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Get all existing follows to user 22
    console.log(`\nChecking existing follows to user ${TARGET_USER_ID}...`);
    const existingFollows = await Follow.findAll({
      where: {
        following_id: TARGET_USER_ID
      },
      attributes: ['follower_id']
    });

    const existingFollowerIds = new Set(
      existingFollows.map(f => f.follower_id)
    );
    console.log(`Found ${existingFollowerIds.size} existing followers of user ${TARGET_USER_ID}`);

    // Prepare follows to create (excluding user 22 itself and existing follows)
    const followsToCreate = [];
    let skippedCount = 0;
    let alreadyFollowingCount = 0;

    for (let userId = MIN_USER_ID; userId <= MAX_USER_ID; userId++) {
      // Skip user 22 itself (can't follow yourself)
      if (userId === TARGET_USER_ID) {
        skippedCount++;
        continue;
      }

      // Skip if already following
      if (existingFollowerIds.has(userId)) {
        alreadyFollowingCount++;
        continue;
      }

      // Add to list of follows to create
      followsToCreate.push({
        follower_id: userId,
        following_id: TARGET_USER_ID,
        created_at: new Date()
      });
    }

    console.log(`\nSummary:`);
    console.log(`- Users to process: ${MAX_USER_ID - MIN_USER_ID + 1}`);
    console.log(`- Skipped (user ${TARGET_USER_ID} itself): ${skippedCount}`);
    console.log(`- Already following: ${alreadyFollowingCount}`);
    console.log(`- New follows to create: ${followsToCreate.length}`);

    if (followsToCreate.length === 0) {
      console.log('\n✅ All users already follow user 22. No action needed.');
      await sequelize.close();
      return;
    }

    // Create follows in batches for better performance
    const BATCH_SIZE = 100;
    let createdCount = 0;
    let errorCount = 0;

    console.log(`\nCreating ${followsToCreate.length} follow relationships in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < followsToCreate.length; i += BATCH_SIZE) {
      const batch = followsToCreate.slice(i, i + BATCH_SIZE);
      
      try {
        // Use bulkCreate with ignoreDuplicates to handle any race conditions
        await Follow.bulkCreate(batch, {
          ignoreDuplicates: true
        });
        createdCount += batch.length;
        
        if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= followsToCreate.length) {
          console.log(`Progress: ${Math.min(i + BATCH_SIZE, followsToCreate.length)}/${followsToCreate.length} follows created`);
        }
      } catch (error) {
        // If batch fails, try individual inserts
        console.error(`Error in batch starting at index ${i}:`, error.message);
        for (const follow of batch) {
          try {
            await Follow.findOrCreate({
              where: {
                follower_id: follow.follower_id,
                following_id: follow.following_id
              },
              defaults: follow
            });
            createdCount++;
          } catch (err) {
            errorCount++;
            console.error(`Error creating follow for user ${follow.follower_id}:`, err.message);
          }
        }
      }
    }

    // Verify the result
    const finalFollows = await Follow.findAll({
      where: {
        following_id: TARGET_USER_ID
      },
      attributes: ['follower_id']
    });

    console.log(`\n✅ Process completed!`);
    console.log(`- Successfully created: ${createdCount} follows`);
    if (errorCount > 0) {
      console.log(`- Errors encountered: ${errorCount}`);
    }
    console.log(`- Total followers of user ${TARGET_USER_ID}: ${finalFollows.length}`);
    console.log(`- Expected followers: ${MAX_USER_ID - MIN_USER_ID} (excluding user ${TARGET_USER_ID} itself)`);

    // Close database connection
    await sequelize.close();
    console.log('\nDatabase connection closed.');

  } catch (error) {
    console.error('Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  makeUser22MostFollowed()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = makeUser22MostFollowed;

