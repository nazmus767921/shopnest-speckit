import { cacheTag, cacheLife } from 'next/cache';
import { getStorefrontSections } from '@/db/queries/storefront-sections';

export async function getCachedStorefrontSections(merchantId: string) {
  "use cache";
  cacheLife('max');
  cacheTag(`storefront-${merchantId}`);
  return getStorefrontSections(merchantId);
}
