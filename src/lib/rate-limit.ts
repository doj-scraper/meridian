import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface IRateLimiter {
  limit: (key: string) => Promise<RateLimitResult>;
}

let apiRateLimiter: IRateLimiter;
let agentRateLimiter: IRateLimiter;

const hasRedisConfig = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

if (hasRedisConfig) {
  const redis = Redis.fromEnv();
  
  const apiLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  });

  const agentLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  });

  apiRateLimiter = {
    limit: async (key: string) => {
      const res = await apiLimiter.limit(key);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    }
  };

  agentRateLimiter = {
    limit: async (key: string) => {
      const res = await agentLimiter.limit(key);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    }
  };
} else {
  // Simple in-memory fallback rate limiter for local dev
  const createMemoryLimiter = (limit: number, windowMs: number): IRateLimiter => {
    const memoryCache = new Map<string, { count: number; resetTime: number }>();
    return {
      limit: async (key: string) => {
        const now = Date.now();
        const record = memoryCache.get(key);
        
        if (!record || now > record.resetTime) {
          const newRecord = { count: 1, resetTime: now + windowMs };
          memoryCache.set(key, newRecord);
          return { success: true, limit, remaining: limit - 1, reset: newRecord.resetTime };
        }
        
        record.count++;
        const success = record.count <= limit;
        return {
          success,
          limit,
          remaining: Math.max(0, limit - record.count),
          reset: record.resetTime,
        };
      }
    };
  };

  apiRateLimiter = createMemoryLimiter(100, 60 * 1000);
  agentRateLimiter = createMemoryLimiter(10, 60 * 1000);
}

export const ratelimit = {
  api: apiRateLimiter,
  agent: agentRateLimiter,
};
