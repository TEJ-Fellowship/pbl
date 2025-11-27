import { sequelize } from "../config/db.js";
import { User, Follow } from "../models/index.js";
import dotenv from "dotenv";

dotenv.config();

// Helper function to generate random username
const generateUsername = (index) => {
  const adjectives = [
    "cool", "awesome", "amazing", "fantastic", "brilliant",
    "stellar", "epic", "legendary", "mystic", "cosmic",
    "digital", "virtual", "neon", "cyber", "quantum",
    "nova", "zen", "wild", "calm", "bright",
  ];
  const nouns = [
    "user", "star", "hero", "ninja", "wizard",
    "warrior", "explorer", "traveler", "creator", "artist",
    "coder", "designer", "photographer", "writer", "thinker",
    "dreamer", "builder", "maker", "sharer", "gamer",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 10000);
  return `${adj}_${noun}_${num}_${index}`;
};

// Helper function to generate random email
const generateEmail = (username) => {
  const domains = [
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "example.com",
  ];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${username}@${domain}`;
};

// Helper function to generate random bio
const generateBio = () => {
  const bios = [
    "Living life to the fullest 🌟",
    "Photography enthusiast 📸",
    "Coffee lover ☕",
    "Travel addict ✈️",
    "Music is my life 🎵",
    "Fitness enthusiast 💪",
    "Foodie at heart 🍕",
    "Tech geek 🤖",
    "Nature lover 🌿",
    "Bookworm 📚",
  ];
  return bios[Math.floor(Math.random() * bios.length)];
};

// Helper function to generate random avatar URL
const generateAvatarUrl = (index) => {
  const gender = Math.random() > 0.5 ? "men" : "women";
  const avatarId = Math.floor(Math.random() * 100);
  return `https://randomuser.me/api/portraits/${gender}/${avatarId}.jpg`;
};

// Main function to seed users
const seedUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    await sequelize.sync();
    console.log("✅ Models synchronized.");

    // Check existing user count
    const existingUserCount = await User.count();
    console.log(`📊 Existing users in database: ${existingUserCount}`);

    // Check if user1 exists, if not create it
    let user1 = await User.findOne({ where: { username: "user1" } });

    if (!user1) {
      user1 = await User.create({
        username: "user1",
        email: "user1@example.com",
        bio: "The original user",
        avatar_url: "https://randomuser.me/api/portraits/men/1.jpg",
        followers_count: 0,
        following_count: 0,
        is_celebrity: false,
      });
      console.log("✅ Created user1");
    } else {
      console.log("✅ user1 already exists");
    }

    const user1Id = user1.id;
    console.log(`📌 user1 ID: ${user1Id}`);

    // Calculate how many users we need to create (target: 100 total for load testing)
    const targetUserCount = 100;
    const usersNeeded = Math.max(0, targetUserCount - existingUserCount);

    if (usersNeeded === 0) {
      console.log(
        `\n✅ Already have ${existingUserCount} users. No new users needed.`
      );
    } else {
      console.log(
        `\n🔄 Need to create ${usersNeeded} more users to reach ${targetUserCount} total...`
      );

      const batchSize = 50;
      const usersToCreate = [];

      for (let i = 1; i <= usersNeeded; i++) {
        const username = generateUsername(i + existingUserCount);
        const email = generateEmail(username);

        usersToCreate.push({
          username: username,
          email: email,
          bio: generateBio(),
          avatar_url: generateAvatarUrl(i + existingUserCount),
          followers_count: 0,
          following_count: 0,
          is_celebrity: Math.random() > 0.9,
        });

        if (usersToCreate.length >= batchSize || i === usersNeeded) {
          try {
            await User.bulkCreate(usersToCreate, {
              ignoreDuplicates: true,
            });
            console.log(
              `✅ Created batch: ${usersToCreate.length} users (Progress: ${i}/${usersNeeded})`
            );
            usersToCreate.length = 0;
          } catch (error) {
            console.error(`⚠️ Error creating batch:`, error.message);
            usersToCreate.length = 0;
          }
        }
      }

      console.log(`\n✅ Finished creating new users.`);
    }

    // Get all users except user1
    const allUsers = await User.findAll({
      where: {
        id: { [sequelize.Sequelize.Op.ne]: user1Id },
      },
    });

    console.log(
      `\n🔄 Creating follow relationships (all users follow user1)...`
    );
    console.log(
      `📊 Found ${allUsers.length} users to create follow relationships for.`
    );

    const followBatchSize = 100;
    const followsToCreate = [];

    for (const user of allUsers) {
      const existingFollow = await Follow.findOne({
        where: {
          follower_id: user.id,
          following_id: user1Id,
        },
      });

      if (!existingFollow) {
        followsToCreate.push({
          follower_id: user.id,
          following_id: user1Id,
          created_at: new Date(),
        });
      }

      if (followsToCreate.length >= followBatchSize) {
        try {
          await Follow.bulkCreate(followsToCreate, {
            ignoreDuplicates: true,
          });
          console.log(
            `✅ Created ${followsToCreate.length} follow relationships`
          );
          followsToCreate.length = 0;
        } catch (error) {
          console.error(`⚠️ Error creating follow batch:`, error.message);
          followsToCreate.length = 0;
        }
      }
    }

    if (followsToCreate.length > 0) {
      try {
        await Follow.bulkCreate(followsToCreate, {
          ignoreDuplicates: true,
        });
        console.log(
          `✅ Created ${followsToCreate.length} follow relationships`
        );
      } catch (error) {
        console.error(`⚠️ Error creating final follow batch:`, error.message);
      }
    }

    const actualFollowCount = await Follow.count({
      where: { following_id: user1Id },
    });

    await User.update(
      { followers_count: actualFollowCount },
      { where: { id: user1Id } }
    );

    const usersWhoFollowUser1 = await Follow.findAll({
      where: { following_id: user1Id },
      attributes: ["follower_id"],
    });

    const followerIds = usersWhoFollowUser1.map((f) => f.follower_id);
    if (followerIds.length > 0) {
      await User.increment("following_count", {
        where: {
          id: {
            [sequelize.Sequelize.Op.in]: followerIds,
          },
        },
      });
    }

    console.log(`\n✅ Updated follower count for user1: ${actualFollowCount}`);
    console.log(`✅ Updated following count for all followers.`);

    const totalUsers = await User.count();
    const totalFollows = await Follow.count();

    console.log(`\n📊 Summary:`);
    console.log(`   Total users in database: ${totalUsers}`);
    console.log(`   Total follow relationships: ${totalFollows}`);
    console.log(`   user1 followers: ${actualFollowCount}`);

    console.log(`\n✅ Seeding completed successfully!`);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  } finally {
    await sequelize.close();
    console.log("\n✅ Database connection closed.");
  }
};

seedUsers()
  .then(() => {
    console.log("\n🎉 Script execution completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script execution failed:", error);
    process.exit(1);
  });