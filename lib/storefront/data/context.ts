import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import type { StorefrontContext, MerchantStore, User, Category } from "@/lib/storefront/types"
import type { StorefrontSection } from "@/lib/storefront/schema/sections"
import { getCachedMerchantBySubdomain } from "@/lib/cache/merchants"
import { getCachedCategories } from "@/lib/cache/categories"
import { getCachedMerchantTheme } from "@/lib/cache/storefront"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getStorefrontContext(
  subdomain: string,
  previewTemplateSlug?: string | null
): Promise<StorefrontContext> {
  "use cache"
  cacheTag(`storefront-${subdomain}`)

  const dbMerchant = await getCachedMerchantBySubdomain(subdomain)
  
  if (!dbMerchant) {
    throw new Error(`Merchant not found for subdomain: ${subdomain}`)
  }

  const store: MerchantStore = {
    id: dbMerchant.id,
    name: dbMerchant.name,
    subdomain: dbMerchant.subdomain,
    template: dbMerchant.template || "general",
    themeSettings: dbMerchant.themeSettings,
  }
  
  let merchant: User = {
    id: dbMerchant.ownerId || "",
    email: "",
    name: "",
  }

  if (dbMerchant.ownerId) {
    const [dbUser] = await db.select().from(user).where(eq(user.id, dbMerchant.ownerId)).limit(1)
    if (dbUser) {
      merchant = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      }
    }
  }
  
  const categories = (await getCachedCategories(store.id)) as unknown as Category[]
  const themeData = await getCachedMerchantTheme(store.id)
  const sections = themeData.activeLayout as any

  const templateSlug = previewTemplateSlug || themeData.themeId || store.template
  
  return {
    store,
    merchant,
    templateSlug,
    isPreview: !!previewTemplateSlug,
    sections,
    menus: {},
    categories,
    themeVars: (store.themeSettings as Record<string, string>) || {},
    cssVariables: (themeData.cssVariables as Record<string, any>) || {}
  }
}
