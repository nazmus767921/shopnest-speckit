import { redis } from './client';
import { getMerchantBySubdomain } from '@/db/queries/merchants';
import { getSubscriptionByMerchantId } from '@/db/queries/subscriptions';
import { merchants, subscriptions } from '@/db/schema';
type Merchant = typeof merchants.$inferSelect;
type Subscription = typeof subscriptions.$inferSelect;

export interface ProxyContext {
  merchant: Merchant | null;
  subscription: Subscription | null;
}

export async function getProxyContext(subdomain: string): Promise<ProxyContext> {
  const cacheKey = `proxy:subdomain:${subdomain}`;
  
  // Try to fetch from Redis
  try {
    const cached = await redis.get<ProxyContext>(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (error) {
    console.error('Redis cache error:', error);
    // Fallthrough to DB on Redis failure
  }

  // Fetch from DB
  const merchant = await getMerchantBySubdomain(subdomain);
  const subscription = merchant ? await getSubscriptionByMerchantId(merchant.id) : null;
  
  const context: ProxyContext = { merchant: merchant || null, subscription: subscription || null };

  // Save to Redis (15 mins)
  if (merchant) {
    try {
      await redis.set(cacheKey, context, { ex: 900 });
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  return context;
}

export async function invalidateProxyCache(merchantId: string): Promise<void> {
  const { getMerchantById } = await import('@/db/queries/merchants');
  const merchant = await getMerchantById(merchantId);
  if (merchant) {
    const cacheKey = `proxy:subdomain:${merchant.subdomain}`;
    try {
      await redis.del(cacheKey);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }
}
