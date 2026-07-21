import { db } from "@/db"
import { flashSales, products, productVariants } from "@/db/schema"
import { eq, and, desc, gte, lte, sql } from "drizzle-orm"

/**
 * Get all flash sales for a merchant, with associated product name.
 * Enforces Invariant 1: always scoped by merchantId.
 */
export async function getFlashSales(merchantId: string) {
  return await db
    .select({
      id: flashSales.id,
      merchantId: flashSales.merchantId,
      productId: flashSales.productId,
      productName: products.name,
      variantId: flashSales.variantId,
      variantSku: productVariants.sku,
      salePricePaisa: flashSales.salePricePaisa,
      limitQuantity: flashSales.limitQuantity,
      soldQuantity: flashSales.soldQuantity,
      startTime: flashSales.startTime,
      endTime: flashSales.endTime,
      isActive: flashSales.isActive,
      createdAt: flashSales.createdAt,
      updatedAt: flashSales.updatedAt,
    })
    .from(flashSales)
    .innerJoin(products, eq(flashSales.productId, products.id))
    .leftJoin(productVariants, eq(flashSales.variantId, productVariants.id))
    .where(eq(flashSales.merchantId, merchantId))
    .orderBy(desc(flashSales.createdAt))
}

/**
 * Get a single flash sale by id, scoped to the merchant (Invariant 1).
 */
export async function getFlashSaleById(merchantId: string, flashSaleId: string) {
  return await db.query.flashSales.findFirst({
    where: and(
      eq(flashSales.merchantId, merchantId),
      eq(flashSales.id, flashSaleId)
    ),
  })
}

/**
 * Create a new flash sale campaign.
 */
export async function createFlashSale(
  merchantId: string,
  data: {
    productId: string
    variantId?: string | null
    salePricePaisa: number
    limitQuantity: number
    startTime: Date
    endTime: Date
  }
) {
  const [newFlashSale] = await db
    .insert(flashSales)
    .values({
      id: crypto.randomUUID(),
      merchantId,
      productId: data.productId,
      variantId: data.variantId ?? null,
      salePricePaisa: data.salePricePaisa,
      limitQuantity: data.limitQuantity,
      soldQuantity: 0,
      startTime: data.startTime,
      endTime: data.endTime,
      isActive: true,
    })
    .returning()

  return newFlashSale
}

/**
 * Update an existing flash sale, scoped to the merchant (Invariant 1).
 */
export async function updateFlashSale(
  merchantId: string,
  flashSaleId: string,
  data: {
    salePricePaisa?: number
    limitQuantity?: number
    endTime?: Date
    isActive?: boolean
  }
) {
  const existing = await getFlashSaleById(merchantId, flashSaleId)
  if (!existing) {
    throw new Error("Flash sale not found.")
  }

  const [updated] = await db
    .update(flashSales)
    .set({
      salePricePaisa: data.salePricePaisa !== undefined ? data.salePricePaisa : existing.salePricePaisa,
      limitQuantity: data.limitQuantity !== undefined ? data.limitQuantity : existing.limitQuantity,
      endTime: data.endTime !== undefined ? data.endTime : existing.endTime,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(flashSales.merchantId, merchantId),
        eq(flashSales.id, flashSaleId)
      )
    )
    .returning()

  return updated
}

/**
 * Get active flash sale for a product (within current time window, isActive, and under stock limits).
 */
export async function getActiveFlashSaleForProduct(merchantId: string, productId: string) {
  const now = new Date()
  return await db.query.flashSales.findFirst({
    where: and(
      eq(flashSales.merchantId, merchantId),
      eq(flashSales.productId, productId),
      eq(flashSales.isActive, true),
      lte(flashSales.startTime, now),
      gte(flashSales.endTime, now),
      sql`${flashSales.soldQuantity} < ${flashSales.limitQuantity}`
    ),
  })
}

/**
 * Delete a flash sale, scoped to the merchant (Invariant 1).
 */
export async function deleteFlashSale(merchantId: string, flashSaleId: string) {
  const existing = await getFlashSaleById(merchantId, flashSaleId)
  if (!existing) {
    throw new Error("Flash sale not found.")
  }

  return await db
    .delete(flashSales)
    .where(
      and(
        eq(flashSales.merchantId, merchantId),
        eq(flashSales.id, flashSaleId)
      )
    )
}
