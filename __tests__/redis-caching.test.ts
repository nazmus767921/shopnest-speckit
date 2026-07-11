import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMerchantBySubdomain } from '../db/queries/merchants';
import { getSubscriptionByMerchantId } from '../db/queries/subscriptions';

// Mock dependencies
vi.mock('../db/queries/merchants', () => ({
  getMerchantBySubdomain: vi.fn(),
}));

vi.mock('../db/queries/subscriptions', () => ({
  getSubscriptionByMerchantId: vi.fn(),
}));

// We'll mock the module that will export our redis client
vi.mock('../lib/redis/client', () => {
  return {
    redis: {
      get: vi.fn(),
      set: vi.fn(),
    },
  };
});

// Since proxy.ts is middleware, it's hard to test directly as a simple function in vitest without Next.js context.
// But we can test the helper function we'll create for proxy caching.
import { getProxyContext } from '../lib/redis/proxy-cache';
import { redis } from '../lib/redis/client';

describe('Proxy Subdomain Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch from database on cache miss and set cache', async () => {
    const subdomain = 'teststore';
    const mockMerchant = { id: 'm1', subdomain };
    const mockSubscription = { plan: 'pro' };

    (redis.get as any).mockResolvedValue(null);
    (getMerchantBySubdomain as any).mockResolvedValue(mockMerchant);
    (getSubscriptionByMerchantId as any).mockResolvedValue(mockSubscription);

    const result = await getProxyContext(subdomain);

    expect(redis.get).toHaveBeenCalledWith(`proxy:subdomain:${subdomain}`);
    expect(getMerchantBySubdomain).toHaveBeenCalledWith(subdomain);
    expect(getSubscriptionByMerchantId).toHaveBeenCalledWith('m1');
    expect(redis.set).toHaveBeenCalledWith(
      `proxy:subdomain:${subdomain}`,
      { merchant: mockMerchant, subscription: mockSubscription },
      { ex: 900 }
    );
    expect(result).toEqual({ merchant: mockMerchant, subscription: mockSubscription });
  });

  it('should return from cache on cache hit and not hit database', async () => {
    const subdomain = 'teststore';
    const mockMerchant = { id: 'm1', subdomain };
    const cachedData = {
      merchant: { id: 'm1', subdomain },
      subscription: { plan: 'pro' },
    };

    (redis.get as any).mockResolvedValue(cachedData);

    const result = await getProxyContext(subdomain);

    expect(redis.get).toHaveBeenCalledWith(`proxy:subdomain:${subdomain}`);
    expect(getMerchantBySubdomain).not.toHaveBeenCalled();
    expect(getSubscriptionByMerchantId).not.toHaveBeenCalled();
    expect(result).toEqual(cachedData);
  });
});
