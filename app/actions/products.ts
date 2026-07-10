"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { createProduct, updateProduct, deleteProduct, getProducts, getProductById } from "@/db/queries/products"
import { productFormSchema } from "@/lib/validations/products"
import { revalidatePath, revalidateTag } from "next/cache"
import { assertPlanLimit } from "@/lib/plans/assertPlan"
import { db } from "@/db"
import { productPromotions } from "@/db/schema"
import { eq, and } from "drizzle-orm"

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

export async function createProductAction(values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    const result = productFormSchema.safeParse(values)
    
    if (!result.success) {
      // Extraction of first error message per zod constraint
      throw new Error(result.error.issues[0].message)
    }

    const { id, name, description, price, compareAtPrice, stockCount, lowStockThreshold, isPublished, images, categoryId, promotionTypes } = result.data

    // Convert Taka (decimal/float) to Paisa (integer)
    const pricePaisa = Math.round(price * 100)
    const compareAtPricePaisa = compareAtPrice ? Math.round(compareAtPrice * 100) : null

    await assertPlanLimit(
      merchant.id,
      "max_images_per_product",
      images.length,
      (limit) => `Your plan allows a maximum of ${limit} product gallery images.`
    )

    const product = await createProduct(
      merchant.id,
      {
        id,
        name,
        description,
        pricePaisa,
        compareAtPricePaisa,
        stockCount,
        lowStockThreshold,
        isPublished,
        categoryId: categoryId || null,
      },
      images,
      promotionTypes
    )

    revalidatePath("/dashboard/products")
    revalidateTag("product-images")
    return { success: true, product }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create product." }
  }
}

export async function updateProductAction(productId: string, values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    const result = productFormSchema.safeParse(values)

    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    const { name, description, price, compareAtPrice, stockCount, lowStockThreshold, isPublished, images, categoryId, promotionTypes } = result.data

    // Convert Taka (decimal/float) to Paisa (integer)
    const pricePaisa = Math.round(price * 100)
    const compareAtPricePaisa = compareAtPrice ? Math.round(compareAtPrice * 100) : null

    await assertPlanLimit(
      merchant.id,
      "max_images_per_product",
      images.length,
      (limit) => `Your plan allows a maximum of ${limit} product gallery images.`
    )

    const product = await updateProduct(
      merchant.id,
      productId,
      {
        name,
        description,
        pricePaisa,
        compareAtPricePaisa,
        stockCount,
        lowStockThreshold,
        isPublished,
        categoryId: categoryId || null,
      },
      images,
      promotionTypes
    )

    revalidatePath("/dashboard/products")
    revalidatePath(`/dashboard/products/${productId}/edit`)
    revalidateTag("product-images")
    return { success: true, product }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update product." }
  }
}

export async function deleteProductAction(productId: string) {
  try {
    const merchant = await getAuthenticatedMerchant()
    await deleteProduct(merchant.id, productId)
    
    revalidatePath("/dashboard/products")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete product." }
  }
}
export async function getMerchantIdForActions() {
  const merchant = await getAuthenticatedMerchant()
  return merchant.id
}

export async function getProductsAction() {
  try {
    const merchant = await getAuthenticatedMerchant()
    const list = await getProducts(merchant.id)
    return {
      success: true,
      products: list.map(p => ({
        ...p,
        price: p.pricePaisa / 100,
        compareAtPrice: p.compareAtPricePaisa ? p.compareAtPricePaisa / 100 : null,
      }))
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch products." }
  }
}

export async function toggleProductPublishAction(productId: string, isPublished: boolean) {
  try {
    const merchant = await getAuthenticatedMerchant()
    await updateProduct(
      merchant.id,
      productId,
      { isPublished }
    )
    revalidatePath("/dashboard/products")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle status." }
  }
}

export async function updateProductStockAction(productId: string, stockCount: number) {
  try {
    const merchant = await getAuthenticatedMerchant()
    if (stockCount < 0) {
      throw new Error("Stock count cannot be negative.")
    }
    await updateProduct(
      merchant.id,
      productId,
      { stockCount }
    )
    revalidatePath("/dashboard/products")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update stock." }
  }
}

export async function toggleProductPromotionAction(
  productId: string,
  promotionType: string,
  active: boolean
) {
  try {
    const merchant = await getAuthenticatedMerchant()
    
    // Ensure the product belongs to this merchant (Invariant 1)
    const product = await getProductById(merchant.id, productId)
    if (!product) {
      throw new Error("Product not found.")
    }

    if (active) {
      // Add promotion
      const existing = await db.query.productPromotions.findFirst({
        where: and(
          eq(productPromotions.productId, productId),
          eq(productPromotions.merchantId, merchant.id),
          eq(productPromotions.promotionType, promotionType)
        ),
      })
      if (!existing) {
        await db.insert(productPromotions).values({
          id: crypto.randomUUID(),
          productId,
          merchantId: merchant.id,
          promotionType,
        })
      }
    } else {
      // Remove promotion
      await db
        .delete(productPromotions)
        .where(
          and(
            eq(productPromotions.productId, productId),
            eq(productPromotions.merchantId, merchant.id),
            eq(productPromotions.promotionType, promotionType)
          )
        )
    }

    revalidatePath("/dashboard/products")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle promotion." }
  }
}


