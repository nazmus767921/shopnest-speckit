import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './client';

export const checkoutRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 checkouts per minute per IP
  prefix: '@upstash/ratelimit/checkout',
  analytics: true,
});

export const otpRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '5 m'), // 3 OTP requests per 5 minutes per IP
  prefix: '@upstash/ratelimit/otp',
  analytics: true,
});

export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 API requests per minute per IP
  prefix: '@upstash/ratelimit/api',
  analytics: true,
});

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
