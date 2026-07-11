import { cacheTag, cacheLife } from 'next/cache';
import { getShippingZones } from '@/db/queries/shippingZones';

export async function getCachedShippingZones(merchantId: string) {
  "use cache";
  cacheLife('max');
  cacheTag(`shipping-${merchantId}`);
  return getShippingZones(merchantId);
}
