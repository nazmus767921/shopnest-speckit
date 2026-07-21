import { db } from "@/db"
import { categories, products, merchants } from "@/db/schema"
import { eq, and, desc, count, isNull, sql } from "drizzle-orm"
import { assertPlanLimit } from "@/lib/plans/assertPlan"

/**
 * Get all categories for a merchant, with the count of active products.
 * Enforces Invariant 1: always scoped by merchantId.
 */
export async function getCategories(merchantId: string) {
  return await db
    .select({
      id: categories.id,
      merchantId: categories.merchantId,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      imageUrl: categories.imageUrl,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      productCount: sql<number>`count(distinct ${products.id})::int`,
    })
    .from(categories)
    .leftJoin(
      products,
      and(
        isNull(products.deletedAt),
        sql`${products.categoryId} = ${categories.id} OR ${products.categoryId} IN (SELECT id FROM categories WHERE parent_id = ${categories.id})`
      )
    )
    .where(eq(categories.merchantId, merchantId))
    .groupBy(categories.id)
    .orderBy(desc(categories.createdAt))
}

/**
 * Get a single category by id, scoped to the merchant (Invariant 1).
 */
export async function getCategoryById(merchantId: string, categoryId: string) {
  return await db.query.categories.findFirst({
    where: and(
      eq(categories.merchantId, merchantId),
      eq(categories.id, categoryId)
    ),
  })
}

/**
 * Create a new category for a merchant.
 * Checks current category count against merchant's plan limit (Starter: 5, Growth: 15, Pro/Others: unlimited)
 * before inserting (Invariant 7).
 */
export async function createCategory(
  merchantId: string,
  data: {
    name: string
    slug: string
    parentId?: string | null
    imageUrl?: string | null
  }
) {
  // Count existing categories
  const [result] = await db
    .select({ value: count() })
    .from(categories)
    .where(eq(categories.merchantId, merchantId))

  const existingCount = result?.value ?? 0

  await assertPlanLimit(
    merchantId,
    "max_categories",
    existingCount,
    (limit) => `Plan Limit Exceeded: Your plan allows a maximum of ${limit} categories.`
  )

  const [newCategory] = await db
    .insert(categories)
    .values({
      id: crypto.randomUUID(),
      merchantId,
      name: data.name,
      slug: data.slug.trim().toLowerCase(),
      parentId: data.parentId ?? null,
      imageUrl: data.imageUrl ?? null,
    })
    .returning()

  return newCategory
}

/**
 * Update an existing category, scoped to the merchant (Invariant 1).
 */
export async function updateCategory(
  merchantId: string,
  categoryId: string,
  data: {
    name: string
    slug: string
    parentId?: string | null
    imageUrl?: string | null
  }
) {
  const existing = await getCategoryById(merchantId, categoryId)
  if (!existing) {
    throw new Error("Category not found.")
  }

  const [updated] = await db
    .update(categories)
    .set({
      name: data.name,
      slug: data.slug.trim().toLowerCase(),
      parentId: data.parentId === undefined ? existing.parentId : data.parentId,
      imageUrl: data.imageUrl === undefined ? existing.imageUrl : data.imageUrl,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(categories.merchantId, merchantId),
        eq(categories.id, categoryId)
      )
    )
    .returning()

  return updated
}

/**
 * Delete a category, scoped to the merchant (Invariant 1).
 * Orphans are handled by setting product categoryId to null (strategy for orphaned products).
 */
export async function deleteCategory(merchantId: string, categoryId: string) {
  const existing = await getCategoryById(merchantId, categoryId)
  if (!existing) {
    throw new Error("Category not found.")
  }

  return await db.transaction(async (tx) => {
    // 1. Orphaned products strategy: set categoryId = null
    await tx
      .update(products)
      .set({ categoryId: null })
      .where(
        and(
          eq(products.merchantId, merchantId),
          eq(products.categoryId, categoryId)
        )
      )

    // 2. Delete the category
    await tx
      .delete(categories)
      .where(
        and(
          eq(categories.merchantId, merchantId),
          eq(categories.id, categoryId)
        )
      )
  })
}
