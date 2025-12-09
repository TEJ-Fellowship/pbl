// config/redis.js
import Redis from "ioredis";
import {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  REDIS_USERNAME,
} from "./index.js";

export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  username: REDIS_USERNAME,
  maxRetriesPerRequest: null, // required for socket.io redis adapter
  lazyConnect: false, // Connect immediately
  enableReadyCheck: true,
});

redis.on("connect", () => console.log("[redis] connected"));
redis.on("ready", () => console.log("[redis] ready"));
redis.on("error", (err) => console.error("[redis] error:", err?.message));
redis.on("close", () => console.warn("[redis] connection closed"));

// Store created clients for cleanup
let adapterClients = null;
let appSubscriber = null;

export function createAdapterClients() {
  // Reuse existing clients if they exist and are connected
  if (adapterClients && adapterClients.pubClient.status === 'ready' && adapterClients.subClient.status === 'ready') {
    return adapterClients;
  }

  const pub = redis.duplicate();
  const sub = redis.duplicate();

  pub.on("error", (e) => console.error("[redis][pub] error:", e?.message));
  sub.on("error", (e) => console.error("[redis][sub] error:", e?.message));

  adapterClients = { pubClient: pub, subClient: sub };
  return adapterClients;
}

export async function createAppSubscriber() {
  // Reuse existing subscriber if it exists and is connected
  if (appSubscriber && appSubscriber.status === 'ready') {
    return appSubscriber;
  }

  const client = redis.duplicate();
  client.on("error", (e) =>
    console.error("[redis][appSub] error:", e?.message)
  );
  
  appSubscriber = client;
  return client;
}

// Cleanup function for graceful shutdown
export async function cleanupRedisClients() {
  try {
    if (adapterClients) {
      await adapterClients.pubClient.quit();
      await adapterClients.subClient.quit();
      adapterClients = null;
    }
    if (appSubscriber) {
      await appSubscriber.quit();
      appSubscriber = null;
    }
  } catch (error) {
    console.error("[redis] Error during cleanup:", error?.message);
  }
}

// Handle process termination
process.on('SIGTERM', cleanupRedisClients);
process.on('SIGINT', cleanupRedisClients);
