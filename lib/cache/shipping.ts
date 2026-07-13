import { cacheTag, cacheLife } from 'next/cache';
import { getShippingZonesWithDistricts } from '@/db/queries/shippingZones';

export async function getCachedShippingZones(merchantId: string) {
  "use cache";
  cacheLife('max');
  cacheTag(`shipping-${merchantId}`);
  return getShippingZonesWithDistricts(merchantId);
}
