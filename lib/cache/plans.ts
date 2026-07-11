import { cacheTag, cacheLife } from 'next/cache';
import { getMerchantPlan } from '@/lib/plans/getPlan';

export async function getCachedMerchantPlan(merchantId: string) {
  "use cache";
  cacheLife('max');
  cacheTag(`plan-${merchantId}`);
  return getMerchantPlan(merchantId);
}
