import { cacheTag, cacheLife } from 'next/cache'
import { getActiveFlashSaleForProduct } from '@/db/queries/flash-sales'

export async function getCachedActiveFlashSaleForProduct(merchantId: string, productId: string) {
  "use cache"
  cacheLife('max')
  cacheTag(`flash-sales-${merchantId}`)
  return getActiveFlashSaleForProduct(merchantId, productId)
}
