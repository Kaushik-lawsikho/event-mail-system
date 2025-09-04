const logger = require("./logger");
let redis = null;
let mem = new Map();

async function init(redisUrl) {
  if (redisUrl) {
    const Redis = require("ioredis");
    redis = new Redis(redisUrl);
    redis.on("error", (e) => logger.error({ e }, "Redis error"));
    await redis.ping();
    logger.info("Idempotency store: Redis");
  } else {
    logger.warn("Idempotency store: In-memory (DEV ONLY)");
  }
}

async function checkAndLock(key, ttlSeconds = 86400) {
  if (redis) {
    // NX set -> returns OK if key was set; null if exists
    const result = await redis.set(`idem:${key}`, "1", "EX", ttlSeconds, "NX");
    return result === "OK"; // true => first time
  } else {
    if (mem.has(key)) return false;
    mem.set(key, Date.now());
    return true;
  }
}

module.exports = { init, checkAndLock };
