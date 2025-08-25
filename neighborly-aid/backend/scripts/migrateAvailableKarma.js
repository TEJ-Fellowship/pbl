const mongoose = require("mongoose");
const User = require("../models/User");
const { dbUrl, dbName } = require("../config/keys");

async function migrateAvailableKarma() {
  try {
    // Connect to database
    const connectionString = dbUrl;
    if (!connectionString) {
      throw new Error("MONGODB_URL is not defined in environment variables");
    }

    const options = {
      dbName: dbName,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(connectionString, options);
    console.log("Connected to MongoDB");

    // Find all users who don't have availableKarmaPoints set
    const users = await User.find({
      $or: [
        { availableKarmaPoints: { $exists: false } },
        { availableKarmaPoints: null },
      ],
    });

    console.log(`Found ${users.length} users to migrate`);

    // Update each user to set availableKarmaPoints equal to karmaPoints
    for (const user of users) {
      await User.findByIdAndUpdate(user._id, {
        availableKarmaPoints: user.karmaPoints || 1000,
      });
      console.log(
        `Migrated user ${user.name}: ${user.karmaPoints} karma points`
      );
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateAvailableKarma();
}

module.exports = migrateAvailableKarma;
