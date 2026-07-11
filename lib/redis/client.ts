import { Redis } from '@upstash/redis';

// Initialize Redis from environment variables
// It will automatically use UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
export const redis = Redis.fromEnv();
