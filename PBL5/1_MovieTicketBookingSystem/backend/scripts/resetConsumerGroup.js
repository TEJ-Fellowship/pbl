/**
 * Reset Kafka consumer group to reprocess messages
 * Run: node backend/scripts/resetConsumerGroup.js
 */

const { kafka } = require("../utils/kafka");
const config = require("../utils/config");

async function resetConsumerGroup() {
  const admin = kafka.admin();

  try {
    await admin.connect();
    console.log("✅ Connected to Kafka admin");

    const groupId = config.KAFKA_GROUP_ID;
    console.log(`🔄 Resetting consumer group: ${groupId}`);

    // Reset offsets to earliest
    await admin.resetOffsets({
      groupId,
      topic: config.KAFKA_TOPIC_BOOKINGS,
      earliest: true,
    });

    console.log("✅ Consumer group reset successfully");
    console.log("   Consumer will now process messages from the beginning");

    await admin.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting consumer group:", error);
    await admin.disconnect();
    process.exit(1);
  }
}

resetConsumerGroup();
