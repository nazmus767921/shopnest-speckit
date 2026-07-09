"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { createMenu, updateMenu, deleteMenu, saveMenuItems } from "@/db/queries/navigation"
import { menuSchema, menuItemsListSchema } from "@/lib/validations/navigation"
import { revalidatePath, revalidateTag } from "next/cache"
import { db } from "@/db"
import { menus, menuItems } from "@/db/schema"
import { and, eq } from "drizzle-orm"

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

export async function createMenuAction(values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    const result = menuSchema.safeParse(values)

    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    const menu = await createMenu({
      merchantId: merchant.id,
      ...result.data,
    })

    revalidateTag(`merchant-${merchant.id}-navigation`, "max")
    revalidatePath("/dashboard/settings/navigation")
    revalidatePath("/", "layout")
    return { success: true, menu }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create menu." }
  }
}

export async function updateMenuAction(id: string, values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    const result = menuSchema.safeParse(values)

    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    const menu = await updateMenu(merchant.id, id, result.data)

    revalidateTag(`merchant-${merchant.id}-navigation`, "max")
    revalidateTag(`menu-${merchant.id}-${result.data.slug}`, "max")
    revalidatePath("/dashboard/settings/navigation")
    revalidatePath("/", "layout")
    return { success: true, menu }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update menu." }
  }
}

export async function deleteMenuAction(id: string) {
  try {
    const merchant = await getAuthenticatedMerchant()
    
    const menu = await db.query.menus.findFirst({
      where: and(eq(menus.id, id), eq(menus.merchantId, merchant.id))
    })

    if (!menu) {
      throw new Error("Menu not found or access denied")
    }

    if (menu.slug === "main-menu" || menu.slug === "footer-menu") {
      throw new Error("Standard menus cannot be deleted")
    }

    await deleteMenu(merchant.id, id)

    revalidateTag(`merchant-${merchant.id}-navigation`, "max")
    revalidatePath("/dashboard/settings/navigation")
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete menu." }
  }
}

export async function resetMenuToDefaultsAction(menuId: string) {
  try {
    const merchant = await getAuthenticatedMerchant()
    
    const menu = await db.query.menus.findFirst({
      where: and(
        eq(menus.id, menuId),
        eq(menus.merchantId, merchant.id)
      )
    })

    if (!menu) {
      throw new Error("Menu not found or access denied")
    }

    if (menu.slug !== "main-menu" && menu.slug !== "footer-menu") {
      throw new Error("Only standard menus can be reset to defaults")
    }

    await db.transaction(async (tx) => {
      // Delete all existing items
      await tx.delete(menuItems).where(eq(menuItems.menuId, menu.id))

      // Insert defaults
      if (menu.slug === "main-menu") {
        const items = [
          { id: crypto.randomUUID(), menuId: menu.id, label: "Home", type: "url" as const, url: "/", position: 0 },
          { id: crypto.randomUUID(), menuId: menu.id, label: "Shop", type: "url" as const, url: "/products", position: 1 },
          { id: crypto.randomUUID(), menuId: menu.id, label: "Orders", type: "url" as const, url: "/orders", position: 2 },
        ]
        await tx.insert(menuItems).values(items)
      } else {
        const shopParentId = crypto.randomUUID()
        const supportParentId = crypto.randomUUID()
        
        const parents = [
          { id: shopParentId, menuId: menu.id, label: "Shop", type: "url" as const, url: "#", position: 0 },
          { id: supportParentId, menuId: menu.id, label: "Support", type: "url" as const, url: "#", position: 1 },
        ]
        await tx.insert(menuItems).values(parents)

        const children = [
          { id: crypto.randomUUID(), menuId: menu.id, parentId: shopParentId, label: "All Products", type: "url" as const, url: "/products", position: 0 },
          { id: crypto.randomUUID(), menuId: menu.id, parentId: supportParentId, label: "Track Orders", type: "url" as const, url: "/orders", position: 0 },
        ]
        await tx.insert(menuItems).values(children)
      }
    })

    revalidateTag(`merchant-${merchant.id}-navigation`, "max")
    revalidatePath("/dashboard/settings/navigation")
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reset menu." }
  }
}

export async function saveMenuItemsAction(menuId: string, values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    const result = menuItemsListSchema.safeParse(values)

    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    const items = await saveMenuItems(merchant.id, menuId, result.data)

    revalidateTag(`merchant-${merchant.id}-navigation`, "max")
    revalidatePath("/dashboard/settings/navigation")
    revalidatePath("/", "layout")
    return { success: true, items }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save menu items." }
  }
}
