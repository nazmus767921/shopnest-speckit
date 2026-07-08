"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { createPage, updatePage, deletePage } from "@/db/queries/pages"
import { pageSchema } from "@/lib/validations/pages"
import { revalidatePath, revalidateTag } from "next/cache"

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

export async function createPageAction(values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    const result = pageSchema.safeParse(values)

    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    const page = await createPage({
      merchantId: merchant.id,
      ...result.data,
    })

    revalidateTag(`merchant-${merchant.id}-pages`)
    revalidatePath("/dashboard/pages")
    revalidatePath("/", "layout")
    return { success: true, page }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create page." }
  }
}

export async function updatePageAction(id: string, values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    const result = pageSchema.safeParse(values)

    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    const page = await updatePage(merchant.id, id, result.data)

    revalidateTag(`merchant-${merchant.id}-pages`)
    if (result.data.slug) {
      revalidateTag(`page-${merchant.id}-${result.data.slug}`)
    }
    revalidatePath("/dashboard/pages")
    revalidatePath(`/dashboard/pages/${id}`)
    revalidatePath("/", "layout")
    return { success: true, page }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update page." }
  }
}

export async function deletePageAction(id: string) {
  try {
    const merchant = await getAuthenticatedMerchant()
    await deletePage(merchant.id, id)

    revalidateTag(`merchant-${merchant.id}-pages`)
    revalidatePath("/dashboard/pages")
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete page." }
  }
}
