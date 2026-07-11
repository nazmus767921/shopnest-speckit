import { cacheTag, cacheLife } from 'next/cache';
import { getPublishedProducts, getPublishedProductBySlug } from '@/db/queries/products';

export async function getCachedPublishedProducts(merchantId: string) {
  "use cache";
  cacheLife('max');
  cacheTag(`products-${merchantId}`);
  return getPublishedProducts(merchantId);
}

export async function getCachedPublishedProductBySlug(merchantId: string, slug: string) {
  "use cache";
  cacheLife('max');
  cacheTag(`products-${merchantId}`);
  return getPublishedProductBySlug(merchantId, slug);
}
