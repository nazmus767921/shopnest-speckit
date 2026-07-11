import { cacheTag, cacheLife } from 'next/cache';
import { getCategories } from '@/db/queries/categories';

export async function getCachedCategories(merchantId: string) {
  "use cache";
  cacheLife('max');
  cacheTag(`categories-${merchantId}`);
  return getCategories(merchantId);
}
