import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const RATE_LIMIT_CONFIG = {
  upload: { maxRequests: 50, windowMs: 5 * 60 * 1000 },
  api: { maxRequests: 200, windowMs: 1 * 60 * 1000 },
  uploadPerUser: { maxRequests: 100, windowMs: 10 * 60 * 1000 },
  uploadPerIP: { maxRequests: 30, windowMs: 5 * 60 * 1000 },
  apiPerUser: { maxRequests: 500, windowMs: 5 * 60 * 1000 },
  apiPerIP: { maxRequests: 150, windowMs: 1 * 60 * 1000 },
} as const;

type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;

const createRateLimiter = (type: RateLimitType) => {
  const { maxRequests, windowMs } = RATE_LIMIT_CONFIG[type];
  const windowSecs = Math.floor(windowMs / 1000);
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowSecs} s`),
  });
};

const upstashLimiters: Record<RateLimitType, Ratelimit> = {
  upload: createRateLimiter('upload'),
  api: createRateLimiter('api'),
  uploadPerUser: createRateLimiter('uploadPerUser'),
  uploadPerIP: createRateLimiter('uploadPerIP'),
  apiPerUser: createRateLimiter('apiPerUser'),
  apiPerIP: createRateLimiter('apiPerIP'),
};

const fallbackBuckets: Record<RateLimitType, Map<string, number[]>> = {
  upload: new Map(),
  api: new Map(),
  uploadPerUser: new Map(),
  uploadPerIP: new Map(),
  apiPerUser: new Map(),
  apiPerIP: new Map(),
};

let fallbackWarningLogged = false;

const applyFallbackLimit = (identifier: string, type: RateLimitType) => {
  const { maxRequests, windowMs } = RATE_LIMIT_CONFIG[type];
  const bucket = fallbackBuckets[type];
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = bucket.get(identifier)?.filter((ts) => ts >= windowStart) ?? [];

  let success = true;
  let remaining = maxRequests - timestamps.length;

  if (remaining <= 0) {
    success = false;
    remaining = 0;
  } else {
    timestamps.push(now);
    remaining -= 1;
  }

  bucket.set(identifier, timestamps);

  const reset = timestamps.length > 0 ? timestamps[0] + windowMs : now + windowMs;

  return {
    success,
    limit: maxRequests,
    remaining,
    reset,
  };
};

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export const rateLimit = async (identifier: string, type: RateLimitType): Promise<RateLimitResult> => {
  const rateLimiter = upstashLimiters[type];
  
  try {
    const result = await rateLimiter.limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    if (!fallbackWarningLogged) {
      console.warn('Rate limiting degraded to local fallback. Check Redis/Upstash availability.');
      fallbackWarningLogged = true;
    }
    console.error('Rate limiting error:', error);
    return applyFallbackLimit(identifier, type);
  }
};

export const rateLimitMultiple = async (
  checks: Array<{ identifier: string; type: RateLimitType }>
): Promise<RateLimitResult> => {
  const results = await Promise.all(
    checks.map(({ identifier, type }) => rateLimit(identifier, type))
  );

  const failed = results.find(r => !r.success);
  if (failed) {
    return failed;
  }

  return results.reduce((mostRestrictive, current) => 
    current.remaining < mostRestrictive.remaining ? current : mostRestrictive
  );
};
