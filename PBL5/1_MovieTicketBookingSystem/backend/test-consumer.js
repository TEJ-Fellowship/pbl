/**
 * Quick test script to verify Kafka consumer is working
 */

const { getConsumer, ensureTopics } = require("./utils/kafka");
const config = require("./utils/config");
const { processBookingRequest } = require("./services/kafkaConsumer");

async function testConsumer() {
  try {
    console.log("🧪 Testing Kafka Consumer...\n");

    // Ensure topic exists
    await ensureTopics([config.KAFKA_TOPIC_BOOKINGS]);
    console.log("✅ Topic exists\n");

    // Get consumer
    const consumer = await getConsumer("test-consumer-group");

    // Subscribe
    await consumer.subscribe({
      topic: config.KAFKA_TOPIC_BOOKINGS,
      fromBeginning: true,
    });
    console.log("✅ Subscribed to topic\n");

    // Process one message
    let messageProcessed = false;
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (messageProcessed) {
          return; // Only process first message
        }
        messageProcessed = true;

        console.log("📨 Received message:");
        console.log("  - Partition:", partition);
        console.log("  - Offset:", message.offset);
        console.log("  - Key:", message.key?.toString());
        console.log("  - Value:", message.value?.toString());

        try {
          const bookingRequest = JSON.parse(message.value.toString());
          console.log("\n🔄 Processing booking request...");
          const result = await processBookingRequest(bookingRequest);

          if (result.success) {
            console.log("✅ Booking processed successfully!");
            console.log("  - Booking ID:", result.booking_id);
            console.log("  - Seats:", result.seat_ids);
          } else {
            console.log("❌ Booking failed:");
            console.log("  - Error:", result.error);
          }
        } catch (error) {
          console.error("❌ Error:", error.message);
          console.error(error.stack);
        }

        // Disconnect after processing one message
        setTimeout(async () => {
          await consumer.disconnect();
          console.log("\n✅ Test complete");
          process.exit(0);
        }, 1000);
      },
    });

    // Timeout after 10 seconds
    setTimeout(async () => {
      if (!messageProcessed) {
        console.log("\n⚠️ No messages found in topic");
        await consumer.disconnect();
        process.exit(0);
      }
    }, 10000);
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

testConsumer();
