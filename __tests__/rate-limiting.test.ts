import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit } from '../lib/redis/rate-limit';

// Mock the Ratelimit instance
vi.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: vi.fn().mockImplementation(() => ({
      limit: vi.fn(),
    })),
  };
});

// Need to grab the mocked instance after importing the module that creates it
import { Ratelimit } from '@upstash/ratelimit';
import { checkoutRateLimiter } from '../lib/redis/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow request when within limits', async () => {
    const ip = '192.168.1.1';
    
    // Setup the mock for limit()
    (checkoutRateLimiter.limit as any).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
    } as any);

    const result = await checkRateLimit(checkoutRateLimiter, ip);
    
    expect(checkoutRateLimiter.limit).toHaveBeenCalledWith(ip);
    expect(result.success).toBe(true);
  });

  it('should block request when limit exceeded', async () => {
    const ip = '192.168.1.1';
    
    (checkoutRateLimiter.limit as any).mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 60000,
    } as any);

    const result = await checkRateLimit(checkoutRateLimiter, ip);
    
    expect(checkoutRateLimiter.limit).toHaveBeenCalledWith(ip);
    expect(result.success).toBe(false);
  });
});
