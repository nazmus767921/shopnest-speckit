"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import {
  getFlashSales,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
} from "@/db/queries/flash-sales"
import { flashSaleCreateSchema, flashSaleUpdateSchema } from "@/lib/validations/flash-sales"
import { revalidatePath, revalidateTag } from "next/cache"
import { db } from "@/db"
import { flashSales, products, productVariants } from "@/db/schema"
import { and, eq, sql, or, isNull } from "drizzle-orm"

async function getAuthenticatedMerchant() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    throw new Error("Unauthorized. Please log in.")
  }
  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    throw new Error("Merchant account not found.")
  }
  return merchant
}

export async function getFlashSalesAction() {
  try {
    const merchant = await getAuthenticatedMerchant()
    const list = await getFlashSales(merchant.id)
    return { success: true, flashSales: list }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch flash sales." }
  }
}

export async function createFlashSaleAction(values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    const result = flashSaleCreateSchema.safeParse(values)
    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    // Verify stock limits
    let availableStock = 0
    if (result.data.variantId) {
      const [variant] = await db
        .select({ stockCount: productVariants.stockCount })
        .from(productVariants)
        .where(eq(productVariants.id, result.data.variantId))
      availableStock = variant ? variant.stockCount : 0
    } else {
      const [product] = await db
        .select({ stockCount: products.stockCount })
        .from(products)
        .where(eq(products.id, result.data.productId))
      availableStock = product ? product.stockCount : 0
    }

    if (result.data.limitQuantity > availableStock) {
      throw new Error(`Flash sale limit quantity (${result.data.limitQuantity}) cannot exceed available stock (${availableStock}).`)
    }

    const created = await createFlashSale(merchant.id, {
      productId: result.data.productId,
      variantId: result.data.variantId,
      salePricePaisa: result.data.salePricePaisa,
      limitQuantity: result.data.limitQuantity,
      startTime: result.data.startTime,
      endTime: result.data.endTime,
    })

    revalidateTag(`flash-sales-${merchant.id}`, "max");
    revalidatePath("/dashboard/flash-sales")
    revalidatePath("/")
    return { success: true, flashSale: created }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create flash sale." }
  }
}

export async function updateFlashSaleAction(id: string, values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    const result = flashSaleUpdateSchema.safeParse(values)
    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    if (result.data.limitQuantity !== undefined) {
      const existing = await db.query.flashSales.findFirst({
        where: and(
          eq(flashSales.merchantId, merchant.id),
          eq(flashSales.id, id)
        ),
      })
      if (!existing) {
        throw new Error("Flash sale not found.")
      }

      let availableStock = 0
      if (existing.variantId) {
        const [variant] = await db
          .select({ stockCount: productVariants.stockCount })
          .from(productVariants)
          .where(eq(productVariants.id, existing.variantId))
        availableStock = variant ? variant.stockCount : 0
      } else {
        const [product] = await db
          .select({ stockCount: products.stockCount })
          .from(products)
          .where(eq(products.id, existing.productId))
        availableStock = product ? product.stockCount : 0
      }

      if (result.data.limitQuantity > availableStock) {
        throw new Error(`Flash sale limit quantity (${result.data.limitQuantity}) cannot exceed available stock (${availableStock}).`)
      }
    }

    const updated = await updateFlashSale(merchant.id, id, result.data)

    revalidateTag(`flash-sales-${merchant.id}`, "max");
    revalidatePath("/dashboard/flash-sales")
    revalidatePath("/")
    return { success: true, flashSale: updated }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update flash sale." }
  }
}

export async function endFlashSaleAction(id: string) {
  try {
    const merchant = await getAuthenticatedMerchant()
    await updateFlashSale(merchant.id, id, { isActive: false })

    revalidateTag(`flash-sales-${merchant.id}`, "max");
    revalidatePath("/dashboard/flash-sales")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to end flash sale." }
  }
}

export async function deleteFlashSaleAction(id: string) {
  try {
    const merchant = await getAuthenticatedMerchant()
    await deleteFlashSale(merchant.id, id)

    revalidateTag(`flash-sales-${merchant.id}`, "max");
    revalidatePath("/dashboard/flash-sales")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete flash sale." }
  }
}

export async function bulkCreateFlashSalesAction(items: unknown[]) {
  try {
    const merchant = await getAuthenticatedMerchant()

    const validatedItems: Array<{
      productId: string
      variantId?: string | null
      salePricePaisa: number
      limitQuantity: number
      startTime: Date
      endTime: Date
    }> = []
    for (const item of items) {
      const result = flashSaleCreateSchema.safeParse(item)
      if (!result.success) {
        throw new Error(result.error.issues[0].message)
      }
      validatedItems.push(result.data)
    }

    await db.transaction(async (tx) => {
      for (const item of validatedItems) {
        const overlapping = await tx
          .select()
          .from(flashSales)
          .where(
            and(
              eq(flashSales.productId, item.productId),
              eq(flashSales.isActive, true),
              sql`NOT (${flashSales.endTime} <= ${item.startTime.toISOString()} OR ${flashSales.startTime} >= ${item.endTime.toISOString()})`,
              item.variantId
                ? or(eq(flashSales.variantId, item.variantId), isNull(flashSales.variantId))
                : sql`true`
            )
          )
          .limit(1)

        if (overlapping.length > 0) {
          const [product] = await tx
            .select({ name: products.name })
            .from(products)
            .where(eq(products.id, item.productId))
          const prodName = product ? product.name : "Selected product"
          throw new Error(`Product "${prodName}" already has an overlapping active flash sale campaign during this period.`)
        }

        // Verify stock limits
        let availableStock = 0
        if (item.variantId) {
          const [variant] = await tx
            .select({ stockCount: productVariants.stockCount })
            .from(productVariants)
            .where(eq(productVariants.id, item.variantId))
          availableStock = variant ? variant.stockCount : 0
        } else {
          const [product] = await tx
            .select({ stockCount: products.stockCount })
            .from(products)
            .where(eq(products.id, item.productId))
          availableStock = product ? product.stockCount : 0
        }

        if (item.limitQuantity > availableStock) {
          const [product] = await tx
            .select({ name: products.name })
            .from(products)
            .where(eq(products.id, item.productId))
          const prodName = product ? product.name : "Selected product"
          throw new Error(`Product "${prodName}" limit quantity (${item.limitQuantity}) cannot exceed available stock (${availableStock}).`)
        }

        await tx.insert(flashSales).values({
          id: crypto.randomUUID(),
          merchantId: merchant.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          salePricePaisa: item.salePricePaisa,
          limitQuantity: item.limitQuantity,
          soldQuantity: 0,
          startTime: item.startTime,
          endTime: item.endTime,
          isActive: true,
        })
      }
    })

    revalidateTag(`flash-sales-${merchant.id}`, "max")
    revalidatePath("/dashboard/flash-sales")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Bulk launch failed." }
  }
}
