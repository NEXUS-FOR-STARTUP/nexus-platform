import { Redis } from "ioredis";
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from "./config.js";

let redisClient: Redis | null = null;

export function getWorkerRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: true,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on("error", (err) => {
      console.warn("[Worker-OMP][Redis] Redis connection warning:", err.message);
    });
  }
  return redisClient;
}
