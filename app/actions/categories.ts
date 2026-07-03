"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/db/queries/categories"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
  slug: z.string().min(2, "Slug must be at least 2 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens."),
})

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

export async function getCategoriesAction() {
  try {
    const merchant = await getAuthenticatedMerchant()
    const categoriesList = await getCategories(merchant.id)
    return { success: true, categories: categoriesList, plan: merchant.plan }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch categories." }
  }
}

export async function createCategoryAction(values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    const result = categorySchema.safeParse(values)
    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    const { name, slug } = result.data
    const created = await createCategory(merchant.id, { name, slug })

    revalidatePath("/dashboard/categories")
    revalidatePath("/dashboard/products")
    return { success: true, category: created }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create category." }
  }
}

export async function updateCategoryAction(categoryId: string, values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    const result = categorySchema.safeParse(values)
    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    const { name, slug } = result.data
    const updated = await updateCategory(merchant.id, categoryId, { name, slug })

    revalidatePath("/dashboard/categories")
    revalidatePath("/dashboard/products")
    return { success: true, category: updated }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update category." }
  }
}

export async function deleteCategoryAction(categoryId: string) {
  try {
    const merchant = await getAuthenticatedMerchant()
    await deleteCategory(merchant.id, categoryId)

    revalidatePath("/dashboard/categories")
    revalidatePath("/dashboard/products")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete category." }
  }
}
