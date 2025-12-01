const { kafka } = require('../utils/kafka');
const { redisClient } = require('../utils/redis');
const { Order, Payment, Inventory, OrderItem } = require('../models');
const { getPrimary } = require('../utils/db');
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { NODE_ENV } = require('../utils/config');
const CircuitBreaker = require('opossum');

// Consumer group for payment workers (can scale horizontally)
const CONSUMER_GROUP_ID = 'payment-workers-group';
const DLQ_TOPIC = 'payments-dlq';
const MAX_RETRIES = 3;

// Simulated payment gateway (replace with real gateway in production)
const fakePaymentGateway = async (payload) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Simulate 95% success rate
  if (Math.random() < 0.95) {
    return {
      success: true,
      status: 'succeeded',
      providerId: 'simulated',
      transactionId: `txn_${uuidv4()}`,
    };
  } else {
    throw new Error('Payment declined by gateway');
  }
};

// Circuit breaker for payment gateway
const circuitBreakerOptions = {
  timeout: 5000, // 5 second timeout
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 30000, // Wait 30 seconds before trying again
  rollingCountTimeout: 60000, // Count errors over 60 seconds
  rollingCountBuckets: 10, // 10 buckets for rolling window
};

const paymentGatewayBreaker = new CircuitBreaker(fakePaymentGateway, circuitBreakerOptions);

// Circuit breaker event handlers
paymentGatewayBreaker.on('open', () => {
  console.error('⚠️ Payment gateway circuit breaker OPEN - too many failures');
});

paymentGatewayBreaker.on('halfOpen', () => {
  console.log('🔄 Payment gateway circuit breaker HALF-OPEN - testing connection');
});

paymentGatewayBreaker.on('close', () => {
  console.log('✅ Payment gateway circuit breaker CLOSED - service recovered');
});

// Send message to Dead Letter Queue
const sendToDLQ = async (paymentData, error, retryCount) => {
  try {
    const producer = kafka.producer({
      idempotent: true,
      maxInFlightRequests: 1,
    });
    await producer.connect();

    await producer.send({
      topic: DLQ_TOPIC,
      messages: [{
        key: paymentData.orderId,
        value: JSON.stringify({
          ...paymentData,
          error: error.message,
          errorStack: error.stack,
          failedAt: new Date().toISOString(),
          retryCount,
          originalTopic: 'payments',
        }),
      }],
    });

    await producer.disconnect();
    console.error(`❌ Sent payment ${paymentData.correlationId} to DLQ after ${retryCount} retries`);
  } catch (dlqError) {
    console.error('❌ Failed to send message to DLQ:', dlqError);
  }
};

/**
 * Process payment for an order
 * Includes idempotency check to prevent duplicate processing
 */
const processPayment = async (paymentData) => {
  const { correlationId, orderId, amount, paymentMethod, userId, sessionId } = paymentData;
  
  // ✅ IDEMPOTENCY CHECK: Check if payment already processed
  const existingStatus = await redisClient.hget(`payment:${correlationId}`, 'status');
  if (existingStatus === 'succeeded') {
    console.log(`⚠️ Payment ${correlationId} already processed (succeeded), skipping`);
    return {
      success: true,
      status: 'succeeded',
      skipped: true,
      message: 'Payment already processed',
    };
  }
  
  // Check if currently processing (prevent concurrent processing)
  if (existingStatus === 'processing') {
    console.log(`⚠️ Payment ${correlationId} is already being processed, skipping`);
    return {
      success: false,
      status: 'processing',
      skipped: true,
      message: 'Payment is being processed',
    };
  }

  const transaction = await getPrimary().transaction({
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    timeout: 30000, // 30 second timeout
  });

  try {
    // Update Redis: processing (with idempotency lock)
    await redisClient.hmset(`payment:${correlationId}`,
      'status', 'processing',
      'startedAt', new Date().toISOString(),
      'processingLock', '1'
    );
    // Set short TTL for processing lock (5 minutes)
    await redisClient.expire(`payment:${correlationId}`, 300);

    // Get order
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
      transaction,
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Call payment gateway through circuit breaker
    let gatewayResponse;
    try {
      gatewayResponse = await paymentGatewayBreaker.fire({
        orderId,
        amount,
        paymentMethod,
        correlationId,
      });
    } catch (breakerError) {
      // Circuit breaker is open or request timed out
      throw new Error(`Payment gateway unavailable: ${breakerError.message}`);
    }

    if (gatewayResponse.success) {
      // Payment succeeded
      await order.update(
        {
          status: 'confirmed',
          payment_status: 'succeeded',
          payment_id: gatewayResponse.transactionId,
          confirmed_at: new Date(),
        },
        { transaction }
      );

      // Create payment record
      await Payment.create(
        {
          order_id: orderId,
          amount,
          payment_method: paymentMethod,
          status: 'succeeded',
          transaction_id: gatewayResponse.transactionId,
          processed_at: new Date(),
        },
        { transaction }
      );

      // Update Redis: success
      await redisClient.hmset(`payment:${correlationId}`,
        'status', 'succeeded',
        'provider', gatewayResponse.providerId,
        'transactionId', gatewayResponse.transactionId,
        'processedAt', new Date().toISOString()
      );

      // Set TTL for payment status (24 hours)
      await redisClient.expire(`payment:${correlationId}`, 86400);

      await transaction.commit();

      if (NODE_ENV === 'development') {
        console.log(`✅ Payment succeeded for order ${orderId} (${correlationId})`);
      }

      return {
        success: true,
        status: 'succeeded',
        transactionId: gatewayResponse.transactionId,
      };
    } else {
      throw new Error('Payment gateway returned failure');
    }
  } catch (error) {
    await transaction.rollback();

    // Update Redis: failed
    await redisClient.hmset(`payment:${correlationId}`,
      'status', 'failed',
      'error', error.message,
      'failedAt', new Date().toISOString()
    );

    // Set TTL for failed payments (7 days for debugging)
    await redisClient.expire(`payment:${correlationId}`, 604800);

    // Release inventory if payment failed
    try {
      const order = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderItem,
            as: 'items',
          },
        ],
      });

      if (order && order.items) {
        for (const item of order.items) {
          // Release from Redis
          const { releaseInventory } = require('../utils/redis');
          await releaseInventory(item.product_id, item.quantity, orderId);

          // Rollback database inventory
          await Inventory.update(
            {
              reserved_quantity: Sequelize.literal(`reserved_quantity - ${item.quantity}`),
              quantity: Sequelize.literal(`quantity + ${item.quantity}`),
            },
            {
              where: { product_id: item.product_id },
            }
          );
        }
      }

      // Update order status (if order exists)
      if (order) {
        await order.update({
          status: 'cancelled',
          payment_status: 'failed',
          cancelled_at: new Date(),
        });
      }
    } catch (rollbackError) {
      console.error('❌ Error during payment failure rollback:', rollbackError);
    }

    if (NODE_ENV === 'development') {
      console.error(`❌ Payment failed for order ${orderId} (${correlationId}):`, error.message);
    }

    return {
      success: false,
      status: 'failed',
      error: error.message,
    };
  }
};

/**
 * Start payment worker consumer
 * Uses manual offset commit for exactly-once processing
 */
const startPaymentWorker = async () => {
  try {
    // Ensure DLQ topic exists
    try {
      const admin = kafka.admin();
      await admin.connect();
      const topics = await admin.listTopics();
      if (!topics.includes(DLQ_TOPIC)) {
        await admin.createTopics({
          topics: [{
            topic: DLQ_TOPIC,
            numPartitions: 3,
            replicationFactor: 1,
          }],
        });
        console.log(`✅ Created DLQ topic: ${DLQ_TOPIC}`);
      }
      await admin.disconnect();
    } catch (dlqError) {
      console.warn(`⚠️ DLQ topic creation failed (non-fatal):`, dlqError.message);
    }

    const consumer = kafka.consumer({
      groupId: CONSUMER_GROUP_ID,
      // Consumer configuration optimized for 1K users
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxInFlightRequests: 5, // Process up to 5 messages concurrently per partition
      // ✅ DISABLE AUTO-COMMIT for manual control
      allowAutoTopicCreation: true,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    await consumer.connect();
    
    if (NODE_ENV === 'development') {
      console.log('✅ Kafka consumer connected');
    }

    // Subscribe to payments topic
    await consumer.subscribe({
      topic: 'payments',
      fromBeginning: false, // Only process new messages
    });

    if (NODE_ENV === 'development') {
      console.log('✅ Subscribed to payments topic');
    }

    // Process messages with manual offset commit
    await consumer.run({
      // Process each message individually for better error handling
      eachMessage: async ({ topic, partition, message }) => {
        let retryCount = 0;
        const paymentData = JSON.parse(message.value.toString());

        while (retryCount < MAX_RETRIES) {
          try {
            if (NODE_ENV === 'development') {
              console.log(
                `📨 Processing payment for order ${paymentData.orderId} (partition: ${partition}, offset: ${message.offset}, retry: ${retryCount})`
              );
            }

            // Process payment
            const result = await processPayment(paymentData);

            // ✅ MANUAL OFFSET COMMIT: Only commit after successful processing
            await consumer.commitOffsets([{
              topic,
              partition,
              offset: (parseInt(message.offset) + 1).toString(),
            }]);

            if (NODE_ENV === 'development') {
              console.log(
                `✅ Payment processed for order ${paymentData.orderId} (offset: ${message.offset})`
              );
            }

            // Success - break retry loop
            break;
          } catch (error) {
            retryCount++;
            console.error(`❌ Error processing payment message (attempt ${retryCount}/${MAX_RETRIES}):`, error.message);

            if (retryCount >= MAX_RETRIES) {
              // Max retries reached - send to DLQ
              console.error(`❌ Max retries reached for payment ${paymentData.correlationId}, sending to DLQ`);
              await sendToDLQ(paymentData, error, retryCount);
              
              // Commit offset even on failure to prevent infinite retry loop
              // Message is now in DLQ for manual investigation
              await consumer.commitOffsets([{
                topic,
                partition,
                offset: (parseInt(message.offset) + 1).toString(),
              }]);
            } else {
              // Wait before retry (exponential backoff)
              const backoffDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }
          }
        }
      },
    });

    if (NODE_ENV === 'development') {
      console.log('🚀 Payment worker started and ready to process payments');
    }

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('🛑 Shutting down payment worker...');
      await consumer.disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return consumer;
  } catch (error) {
    console.error('❌ Failed to start payment worker:', error);
    throw error;
  }
};

module.exports = {
  startPaymentWorker,
  processPayment,
};

