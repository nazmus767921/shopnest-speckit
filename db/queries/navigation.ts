import { db } from "@/db"
import { menus, menuItems } from "@/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

export async function seedDefaultMenu(merchantId: string, slug: "main-menu" | "footer-menu") {
  return await db.transaction(async (tx) => {
    const [menu] = await tx.insert(menus).values({
      id: crypto.randomUUID(),
      merchantId,
      name: slug === "main-menu" ? "Main Menu" : "Footer Menu",
      slug,
    }).returning()

    if (slug === "main-menu") {
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

    return menu
  })
}

export async function getMenus(merchantId: string) {
  let existing = await db.query.menus.findMany({
    where: eq(menus.merchantId, merchantId),
    with: {
      items: {
        orderBy: asc(menuItems.position),
        with: {
          page: true,
          category: true,
          product: true,
        }
      }
    },
    orderBy: (menus, { desc }) => [desc(menus.createdAt)],
  })

  const hasMainMenu = existing.some(m => m.slug === "main-menu")
  const hasFooterMenu = existing.some(m => m.slug === "footer-menu")

  if (!hasMainMenu || !hasFooterMenu) {
    if (!hasMainMenu) {
      await seedDefaultMenu(merchantId, "main-menu")
    }
    if (!hasFooterMenu) {
      await seedDefaultMenu(merchantId, "footer-menu")
    }
    
    existing = await db.query.menus.findMany({
      where: eq(menus.merchantId, merchantId),
      with: {
        items: {
          orderBy: asc(menuItems.position),
          with: {
            page: true,
            category: true,
            product: true,
          }
        }
      },
      orderBy: (menus, { desc }) => [desc(menus.createdAt)],
    })
  }

  return existing
}

export async function getMenuById(merchantId: string, id: string) {
  return await db.query.menus.findFirst({
    where: and(
      eq(menus.merchantId, merchantId),
      eq(menus.id, id)
    ),
    with: {
      items: {
        orderBy: asc(menuItems.position),
        with: {
          page: true,
          category: true,
          product: true,
        }
      }
    }
  })
}

export async function getMenuBySlug(merchantId: string, slug: string) {
  return await db.query.menus.findFirst({
    where: and(
      eq(menus.merchantId, merchantId),
      eq(menus.slug, slug)
    ),
    with: {
      items: {
        orderBy: asc(menuItems.position),
        with: {
          page: true,
          category: true,
          product: true,
        }
      }
    }
  })
}

export async function getCachedMenuBySlug(merchantId: string, slug: string) {
  "use cache"
  cacheLife("hours")
  cacheTag(`merchant-${merchantId}-navigation`, `menu-${merchantId}-${slug}`)
  return await getMenuBySlug(merchantId, slug)
}

export async function createMenu(data: { merchantId: string; name: string; slug: string }) {
  const [menu] = await db.insert(menus).values({
    id: crypto.randomUUID(),
    merchantId: data.merchantId,
    name: data.name,
    slug: data.slug,
  }).returning()
  return menu
}

export async function updateMenu(merchantId: string, id: string, data: { name?: string; slug?: string }) {
  const [menu] = await db.update(menus).set({
    ...data,
    updatedAt: new Date(),
  }).where(
    and(
      eq(menus.id, id),
      eq(menus.merchantId, merchantId)
    )
  ).returning()
  return menu
}

export async function deleteMenu(merchantId: string, id: string) {
  await db.delete(menus).where(
    and(
      eq(menus.id, id),
      eq(menus.merchantId, merchantId)
    )
  )
}

export interface SaveMenuItemInput {
  id: string
  parentId?: string | null
  label: string
  type: "url" | "page" | "category" | "product"
  referenceId?: string | null
  url?: string | null
  position: number
}

export async function saveMenuItems(merchantId: string, menuId: string, items: SaveMenuItemInput[]) {
  // Verify menu ownership
  const menu = await db.query.menus.findFirst({
    where: and(
      eq(menus.id, menuId),
      eq(menus.merchantId, merchantId)
    )
  })
  
  if (!menu) {
    throw new Error("Menu not found or access denied")
  }

  return await db.transaction(async (tx) => {
    // 1. Delete existing items
    await tx.delete(menuItems).where(eq(menuItems.menuId, menuId))

    if (items.length === 0) return []

    // 2. Insert parent items first, then child items to prevent FK constraint issues
    // Alternatively, defer constraints, but separating them is safer and easy.
    const parents = items.filter(item => !item.parentId)
    const children = items.filter(item => !!item.parentId)

    const insertedParents = parents.length > 0 ? await tx.insert(menuItems).values(
      parents.map(p => ({
        id: p.id,
        menuId,
        parentId: null,
        label: p.label,
        type: p.type,
        referenceId: p.referenceId || null,
        url: p.url || null,
        position: p.position,
      }))
    ).returning() : []

    const insertedChildren = children.length > 0 ? await tx.insert(menuItems).values(
      children.map(c => ({
        id: c.id,
        menuId,
        parentId: c.parentId,
        label: c.label,
        type: c.type,
        referenceId: c.referenceId || null,
        url: c.url || null,
        position: c.position,
      }))
    ).returning() : []

    return [...insertedParents, ...insertedChildren]
  })
}
