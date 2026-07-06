import { db } from "@/db"
import { products, productImages, merchants, productPromotions, productVariants } from "@/db/schema"
import { eq, and, isNull, desc, count, ilike, or, sql } from "drizzle-orm"
import { assertPlanLimit } from "@/lib/plans/assertPlan"

export async function syncParentProductStock(tx: any, productId: string) {
  const [sumResult] = await tx
    .select({ totalStock: sql<number>`COALESCE(SUM(${productVariants.stockCount}), 0)` })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.productId, productId),
        eq(productVariants.isActive, true)
      )
    )
  const totalStock = Number(sumResult?.totalStock ?? 0)

  await tx
    .update(products)
    .set({ stockCount: totalStock, updatedAt: new Date() })
    .where(eq(products.id, productId))

  return totalStock
}


// Helper to generate a URL-safe unique slug
function generateUniqueSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  return `${baseSlug || "product"}-${randomSuffix}`
}

export async function getProducts(merchantId: string) {
  return await db.query.products.findMany({
    where: and(
      eq(products.merchantId, merchantId),
      isNull(products.deletedAt)
    ),
    with: {
      images: {
        orderBy: (images, { asc }) => [asc(images.displayOrder)],
      },
      category: true,
      promotions: true,
    },
    orderBy: [desc(products.createdAt)],
  })
}

export async function getProductById(merchantId: string, productId: string) {
  return await db.query.products.findFirst({
    where: and(
      eq(products.merchantId, merchantId),
      eq(products.id, productId),
      isNull(products.deletedAt)
    ),
    with: {
      images: {
        orderBy: (images, { asc }) => [asc(images.displayOrder)],
      },
      category: true,
      promotions: true,
    },
  })
}

export async function createProduct(
  merchantId: string,
  data: {
    id?: string
    name: string
    description?: string
    pricePaisa: number
    compareAtPricePaisa?: number | null
    stockCount?: number
    lowStockThreshold?: number
    isPublished?: boolean
    categoryId?: string | null
  },
  images: string[] = [],
  promotionTypes: string[] = []
) {
  // Enforce Invariant 7: Subscription limits must be enforced server-side
  const [countResult] = await db
    .select({ value: count() })
    .from(products)
    .where(and(eq(products.merchantId, merchantId), isNull(products.deletedAt)))

  await assertPlanLimit(
    merchantId,
    "max_products",
    countResult?.value ?? 0,
    (limit) => `Plan Limit Exceeded: Your plan allows a maximum of ${limit} active products.`
  )

  const productId = data.id || crypto.randomUUID()
  const slug = generateUniqueSlug(data.name)

  return await db.transaction(async (tx) => {
    // Insert product
    const [newProduct] = await tx
      .insert(products)
      .values({
        id: productId,
        merchantId,
        name: data.name,
        slug,
        description: data.description || null,
        pricePaisa: data.pricePaisa,
        compareAtPricePaisa: data.compareAtPricePaisa ?? null,
        stockCount: data.stockCount ?? 0,
        lowStockThreshold: data.lowStockThreshold ?? 5,
        isPublished: data.isPublished ?? false,
        categoryId: data.categoryId || null,
      })
      .returning()

    // Insert images
    if (images.length > 0) {
      const imageValues = images.map((path, idx) => ({
        id: crypto.randomUUID(),
        productId,
        merchantId,
        storagePath: path,
        displayOrder: idx,
      }))
      await tx.insert(productImages).values(imageValues)
    }

    // Insert promotions
    if (promotionTypes.length > 0) {
      const promotionValues = promotionTypes.map((type) => ({
        id: crypto.randomUUID(),
        productId,
        merchantId,
        promotionType: type,
      }))
      await tx.insert(productPromotions).values(promotionValues)
    }

    return newProduct
  })
}

export async function updateProduct(
  merchantId: string,
  productId: string,
  data: {
    name?: string
    description?: string
    pricePaisa?: number
    compareAtPricePaisa?: number | null
    stockCount?: number
    lowStockThreshold?: number
    isPublished?: boolean
    categoryId?: string | null
  },
  images?: string[],
  promotionTypes?: string[]
) {
  // Ensure the product belongs to this merchant
  const existingProduct = await getProductById(merchantId, productId)
  if (!existingProduct) {
    throw new Error("Product not found.")
  }

  const updates: Partial<typeof products.$inferInsert> = {
    ...data,
    updatedAt: new Date(),
  }

  if (data.name) {
    updates.slug = generateUniqueSlug(data.name)
  }

  if (existingProduct.hasVariants) {
    delete updates.stockCount
  }

  return await db.transaction(async (tx) => {
    // Update product details
    const [updatedProduct] = await tx
      .update(products)
      .set(updates)
      .where(
        and(
          eq(products.merchantId, merchantId),
          eq(products.id, productId)
        )
      )
      .returning()

    if (existingProduct.hasVariants) {
      await syncParentProductStock(tx, productId)
    }

    // Update images if provided
    if (images !== undefined) {
      // Delete old images
      await tx
        .delete(productImages)
        .where(
          and(
            eq(productImages.productId, productId),
            eq(productImages.merchantId, merchantId)
          )
        )

      // Insert new images
      if (images.length > 0) {
        const imageValues = images.map((path, idx) => ({
          id: crypto.randomUUID(),
          productId,
          merchantId,
          storagePath: path,
          displayOrder: idx,
        }))
        await tx.insert(productImages).values(imageValues)
      }
    }

    // Update promotions if provided
    if (promotionTypes !== undefined) {
      await tx
        .delete(productPromotions)
        .where(
          and(
            eq(productPromotions.productId, productId),
            eq(productPromotions.merchantId, merchantId)
          )
        )

      if (promotionTypes.length > 0) {
        const promotionValues = promotionTypes.map((type) => ({
          id: crypto.randomUUID(),
          productId,
          merchantId,
          promotionType: type,
        }))
        await tx.insert(productPromotions).values(promotionValues)
      }
    }

    return updatedProduct
  })
}

export async function deleteProduct(merchantId: string, productId: string) {
  // Ensure product exists
  const existingProduct = await getProductById(merchantId, productId)
  if (!existingProduct) {
    throw new Error("Product not found.")
  }

  return await db
    .update(products)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(products.merchantId, merchantId),
        eq(products.id, productId)
      )
    )
    .returning()
}

export async function getPublishedProducts(merchantId: string) {
  return await db.query.products.findMany({
    where: and(
      eq(products.merchantId, merchantId),
      eq(products.isPublished, true),
      isNull(products.deletedAt)
    ),
    with: {
      images: {
        orderBy: (images, { asc }) => [asc(images.displayOrder)],
      },
      category: true,
      promotions: true,
      attributes: {
        orderBy: (attrs, { asc }) => [asc(attrs.sortOrder)],
        with: {
          options: {
            orderBy: (opts, { asc }) => [asc(opts.sortOrder)],
          },
        },
      },
      variants: {
        orderBy: (vars, { asc }) => [asc(vars.sortOrder)],
        with: {
          attributeLinks: {
            with: {
              attributeOption: true,
            },
          },
        },
      },
    },
    orderBy: [desc(products.createdAt)],
  })
}


export async function getPublishedProductBySlug(merchantId: string, slug: string) {
  return await db.query.products.findFirst({
    where: and(
      eq(products.merchantId, merchantId),
      eq(products.slug, slug),
      eq(products.isPublished, true),
      isNull(products.deletedAt)
    ),
    with: {
      images: {
        orderBy: (images, { asc }) => [asc(images.displayOrder)],
      },
      category: true,
      promotions: true,
    },
  })
}

export async function getFilteredPublishedProducts(
  merchantId: string,
  filters: { categoryId?: string | null; search?: string | null }
) {
  const conditions = [
    eq(products.merchantId, merchantId),
    eq(products.isPublished, true),
    isNull(products.deletedAt),
  ]

  if (filters.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId))
  }

  if (filters.search) {
    const searchCondition = or(
      ilike(products.name, `%${filters.search}%`),
      ilike(products.description, `%${filters.search}%`)
    )
    if (searchCondition) {
      conditions.push(searchCondition)
    }
  }

  return await db.query.products.findMany({
    where: and(...conditions),
    with: {
      images: {
        orderBy: (images, { asc }) => [asc(images.displayOrder)],
      },
      category: true,
      promotions: true,
      attributes: {
        orderBy: (attrs, { asc }) => [asc(attrs.sortOrder)],
        with: {
          options: {
            orderBy: (opts, { asc }) => [asc(opts.sortOrder)],
          },
        },
      },
      variants: {
        orderBy: (vars, { asc }) => [asc(vars.sortOrder)],
        with: {
          attributeLinks: {
            with: {
              attributeOption: true,
            },
          },
        },
      },
    },
    orderBy: [desc(products.createdAt)],
  })
}


