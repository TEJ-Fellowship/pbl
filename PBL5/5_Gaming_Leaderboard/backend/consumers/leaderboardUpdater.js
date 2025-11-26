const { consumer, redis } = require("../util/db");
const redisService = require("../services/redisService");
const kafkaService = require("../services/kafkaService");

/**
 * Kafka Consumer - Processes score-submitted events and updates Redis leaderboards
 * This runs as a background process
 */

let isRunning = false;

const startConsumer = async () => {
  if (isRunning) {
    console.log("⚠️ Consumer is already running");
    return;
  }

  try {
    console.log("🔄 Starting leaderboard updater consumer...");

    await consumer.run({
      // Process messages in batches for better performance
      eachBatch: async ({ batch }) => {
        const events = [];
        const today = new Date().toISOString().split("T")[0];

        // Parse all events
        for (const message of batch.messages) {
          try {
            const event = JSON.parse(message.value.toString());
            events.push(event);
          } catch (error) {
            console.error("❌ Error parsing message:", error);
          }
        }

        if (events.length === 0) return;

        // Get old ranks before updates (for rank change notifications)
        const oldRanks = new Map();
        for (const event of events) {
          const oldRankData = await redisService.getPlayerRank(
            event.playerId,
            event.gameMode,
            "global"
          );
          oldRanks.set(`${event.playerId}:${event.gameMode}`, oldRankData?.rank || null);
        }

        // Batch all Redis operations in a single pipeline
        const pipeline = redis.pipeline();
        const playersToCreate = new Set();

        for (const event of events) {
          const { playerId, username, gameMode, score } = event;

          // Track players that need to be created
          const playerExists = await redis.exists(`player:${playerId}`);
          if (!playerExists) {
            playersToCreate.add(playerId);
            pipeline.hset(`player:${playerId}`, {
              username,
              total_score: 0,
              games_played: 0,
              created_at: new Date().toISOString(),
            });
          } else {
            // Update username if changed
            pipeline.hset(`player:${playerId}`, "username", username);
          }

          // Update global leaderboard
          pipeline.zincrby(`leaderboard:${gameMode}:global`, score, playerId);

          // Update daily leaderboard
          const dailyKey = `leaderboard:${gameMode}:daily:${today}`;
          pipeline.zincrby(dailyKey, score, playerId);
          pipeline.expire(dailyKey, 7 * 24 * 60 * 60); // 7 days TTL

          // Update player stats
          pipeline.hincrby(`player:${playerId}`, "total_score", score);
          pipeline.hincrby(`player:${playerId}`, "games_played", 1);
        }

        // Execute all Redis operations in one batch
        await pipeline.exec();

        // Get new ranks and publish rank change events
        for (const event of events) {
          try {
            const newRankData = await redisService.getPlayerRank(
              event.playerId,
              event.gameMode,
              "global"
            );
            const oldRank = oldRanks.get(`${event.playerId}:${event.gameMode}`);

            if (newRankData && newRankData.rank !== oldRank) {
              // Rank changed - publish event
              await kafkaService.publishLeaderboardUpdated({
                gameMode: event.gameMode,
                playerId: event.playerId,
                newRank: newRankData.rank,
                oldRank: oldRank,
                score: newRankData.score,
              });
            }
          } catch (error) {
            console.error("❌ Error publishing rank update:", error);
          }
        }

        console.log(`✅ Processed batch of ${events.length} messages`);
      },
    });

    isRunning = true;
    console.log("✅ Leaderboard updater consumer started");
  } catch (error) {
    console.error("❌ Failed to start consumer:", error);
    isRunning = false;
    throw error;
  }
};

const stopConsumer = async () => {
  if (!isRunning) {
    return;
  }

  try {
    await consumer.disconnect();
    isRunning = false;
    console.log("✅ Consumer stopped");
  } catch (error) {
    console.error("❌ Error stopping consumer:", error);
  }
};

module.exports = {
  startConsumer,
  stopConsumer,
  isRunning: () => isRunning,
};
