import { unstable_cache as cache, cacheTag, cacheLife } from 'next/cache';
import { getMerchantById, getMerchantByOwnerId } from '@/db/queries/merchants';

export async function getCachedMerchantById(merchantId: string) {
  "use cache";
  cacheLife('max');
  cacheTag(`merchant-${merchantId}`);
  return getMerchantById(merchantId);
}

export async function getCachedMerchantByOwnerId(ownerId: string) {
  "use cache";
  cacheLife('max');
  // We can't tag by merchantId here directly because we don't have it, 
  // but we can tag by ownerId for invalidation.
  cacheTag(`merchant-owner-${ownerId}`);
  return getMerchantByOwnerId(ownerId);
}
