import { io } from 'socket.io-client';
import Redis from 'ioredis';
import {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  REDIS_USERNAME,
} from './src/config/index.js';
import { v4 as uuidv4 } from 'uuid';

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:80';
const TOTAL_USERS = parseInt(process.env.TOTAL_USERS || '100');
const CONCURRENT_CONNECTIONS = parseInt(process.env.CONCURRENT || '20');

// Redis client to check online users
const redis = new Redis({
  host: REDIS_HOST || 'localhost',
  port: REDIS_PORT || 6379,
  password: REDIS_PASSWORD,
  username: REDIS_USERNAME,
});

const serverStats = {
  'server-1': 0,
  'server-2': 0,
  'server-3': 0,
  'unknown': 0,
  'errors': 0,
};

const connectedUsers = [];
const messageStats = {
  sent: 0,
  received: 0,
  errors: 0,
};

// Generate unique user IDs
const userIds = Array.from({ length: TOTAL_USERS }, () => uuidv4());

function connectUser(userId, index) {
  return new Promise((resolve) => {
    const socket = io(TARGET_URL, {
      transports: ['websocket', 'polling'],
      query: { userId },
      reconnection: false,
      timeout: 10000,
    });

    const userData = {
      userId,
      socket,
      connected: false,
      serverId: null,
      messagesReceived: 0,
    };

    socket.on('connect', () => {
      userData.connected = true;
      connectedUsers.push(userData);
      
      // Log connection for debugging (first 5 only)
      if (index < 5) {
        console.log(`[User ${index}] Connected with userId: ${userId.substring(0, 8)}...`);
      }
      
      // Send heartbeat after connection
      setTimeout(() => {
        socket.emit('heartbeat');
      }, 1000);
      
      resolve(userData);
    });

    socket.on('connect_error', (error) => {
      serverStats['errors']++;
      console.error(`[User ${index}] Connection error:`, error.message);
      socket.disconnect();
      resolve(null);
    });

    socket.on('user:status', (data) => {
      // Track status updates
    });

    socket.on('message:receive', (message) => {
      userData.messagesReceived++;
      messageStats.received++;
    });

    socket.on('disconnect', () => {
      userData.connected = false;
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!userData.connected) {
        serverStats['errors']++;
        socket.disconnect();
        resolve(null);
      }
    }, 10000);
  });
}

async function checkRedisOnlineUsers() {
  console.log('\n🔍 Checking Redis for online users...\n');
  
  try {
    const keys = await redis.keys('online:*');
    const users = {};
    const serverDistribution = {
      'server-1': 0,
      'server-2': 0,
      'server-3': 0,
      'unknown': 0,
    };

    for (const key of keys) {
      const userId = key.replace('online:', '');
      const serverId = await redis.get(key);
      const ttl = await redis.ttl(key);
      
      users[userId] = {
        serverId: serverId || 'unknown',
        ttl: ttl,
      };

      if (serverDistribution[serverId] !== undefined) {
        serverDistribution[serverId]++;
      } else {
        serverDistribution['unknown']++;
      }
    }

    console.log('📊 Redis Online Users Summary:');
    console.log('================================');
    console.log(`Total online users in Redis: ${keys.length}`);
    console.log('\nServer Distribution:');
    Object.entries(serverDistribution).forEach(([server, count]) => {
      if (count > 0) {
        const percentage = ((count / keys.length) * 100).toFixed(2);
        const bar = '█'.repeat(Math.floor(percentage / 5));
        console.log(`  ${server.padEnd(12)}: ${String(count).padStart(4)} (${percentage.padStart(5)}%) ${bar}`);
      }
    });

    return { total: keys.length, distribution: serverDistribution, users };
  } catch (error) {
    console.error('❌ Error checking Redis:', error.message);
    return null;
  }
}

async function sendTestMessages() {
  console.log('\n📤 Sending test messages between users...\n');
  
  // Send messages from first 10 users to random recipients
  const senders = connectedUsers.slice(0, Math.min(10, connectedUsers.length));
  const promises = [];

  for (const sender of senders) {
    if (!sender.connected) continue;

    // Pick a random recipient
    const recipient = connectedUsers[Math.floor(Math.random() * connectedUsers.length)];
    if (!recipient || recipient.userId === sender.userId) continue;

    const conversationId = uuidv4();
    
    // Join conversation
    sender.socket.emit('conversation:join', {
      conversationId,
      receiver: { user_id: recipient.userId },
    });

    // Send message after a delay
    setTimeout(() => {
      sender.socket.emit('message:send', {
        conversationId,
        senderId: sender.userId,
        content: `Hello from ${sender.userId.substring(0, 8)}!`,
      });
      messageStats.sent++;
    }, 500);
  }

  // Wait for messages to be processed
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

async function runTest() {
  console.log('🚀 Starting WebSocket Load Test');
  console.log('================================\n');
  console.log(`Target: ${TARGET_URL}`);
  console.log(`Total Users: ${TOTAL_USERS}`);
  console.log(`Concurrent Connections: ${CONCURRENT_CONNECTIONS}\n`);

  const startTime = Date.now();

  // Connect users in batches
  console.log('📡 Connecting users...\n');
  const batches = Math.ceil(TOTAL_USERS / CONCURRENT_CONNECTIONS);

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * CONCURRENT_CONNECTIONS;
    const batchSize = Math.min(CONCURRENT_CONNECTIONS, TOTAL_USERS - batchStart);
    const batchUsers = userIds.slice(batchStart, batchStart + batchSize);

    const promises = batchUsers.map((userId, idx) =>
      connectUser(userId, batchStart + idx)
    );

    await Promise.all(promises);
    const completed = Math.min((batch + 1) * CONCURRENT_CONNECTIONS, TOTAL_USERS);
    process.stdout.write(
      `\rProgress: ${completed}/${TOTAL_USERS} (${((completed / TOTAL_USERS) * 100).toFixed(1)}%)`
    );
  }

  const connectTime = Date.now();
  const connectDuration = ((connectTime - startTime) / 1000).toFixed(2);

  console.log(`\n\n✅ Connection phase completed in ${connectDuration}s`);
  console.log(`Connected users: ${connectedUsers.length}/${TOTAL_USERS}`);

  // Wait a bit for all connections to stabilize
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Check Redis
  const redisData = await checkRedisOnlineUsers();

  // Send test messages
  await sendTestMessages();

  // Wait for messages to propagate
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Final Redis check
  console.log('\n🔍 Final Redis check...\n');
  const finalRedisData = await checkRedisOnlineUsers();

  // Calculate server distribution from connected users
  // Note: We can't directly know which server from socket, but Redis tells us
  if (redisData) {
    console.log('\n📊 Load Distribution Analysis:');
    console.log('================================');
    const serversUsed = Object.entries(redisData.distribution)
      .filter(([k, v]) => k !== 'unknown' && v > 0)
      .length;

    if (serversUsed > 1) {
      console.log(
        `✅ Load balancing is working! Users distributed across ${serversUsed} servers`
      );
    } else if (serversUsed === 1) {
      console.log('⚠️  All users on one server. This might be normal with sticky sessions.');
    }
  }

  // Message stats
  console.log('\n📨 Message Statistics:');
  console.log('======================');
  console.log(`Sent: ${messageStats.sent}`);
  console.log(`Received: ${messageStats.received}`);
  console.log(`Errors: ${messageStats.errors}`);

  // Summary
  const endTime = Date.now();
  const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(50));
  console.log('📋 Test Summary:');
  console.log('='.repeat(50));
  console.log(`Total Users: ${TOTAL_USERS}`);
  console.log(`Connected: ${connectedUsers.length}`);
  console.log(`Online in Redis: ${redisData?.total || 0}`);
  console.log(`Total Duration: ${totalDuration}s`);
  console.log(`Connection Rate: ${(connectedUsers.length / parseFloat(connectDuration)).toFixed(2)} users/sec`);
  console.log('='.repeat(50) + '\n');

  // Cleanup
  console.log('🧹 Disconnecting all users...\n');
  connectedUsers.forEach((user) => {
    if (user.socket && user.connected) {
      user.socket.disconnect();
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Final Redis check after disconnect
  const keysAfter = await redis.keys('online:*');
  console.log(`\n✅ Cleanup complete. Online users remaining: ${keysAfter.length}\n`);

  await redis.quit();
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

runTest().catch(async (error) => {
  console.error('Test failed:', error);
  await redis.quit();
  process.exit(1);
});
