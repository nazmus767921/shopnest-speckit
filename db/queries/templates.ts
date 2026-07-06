import { db } from "@/db"
import { storeTemplates } from "@/db/schema"
import { eq, asc } from "drizzle-orm"

/**
 * Get all active templates, ordered by sortOrder ascending.
 */
export async function getActiveTemplates() {
  return await db.query.storeTemplates.findMany({
    where: eq(storeTemplates.isActive, true),
    orderBy: [asc(storeTemplates.sortOrder)],
  })
}

/**
 * Get active templates allowed for a specific subscription tier.
 */
export async function getTemplatesForTier(tier: string) {
  const activeTemplates = await getActiveTemplates()
  return activeTemplates.filter((template) => {
    const allowed = template.allowedTiers as string[]
    return Array.isArray(allowed) && allowed.includes(tier)
  })
}

/**
 * Get a single template by its unique slug.
 */
export async function getTemplateBySlug(slug: string) {
  return await db.query.storeTemplates.findFirst({
    where: eq(storeTemplates.slug, slug),
  })
}

/**
 * Resolves the best-fit template for a merchant's business type and subscription tier.
 * Fallback to the default active template if no match is found.
 */
export async function resolveTemplateForBusinessType(businessType: string, tier: string) {
  const activeTemplates = await getActiveTemplates()

  // 1. Find templates where businessType matches and tier is allowed
  const matches = activeTemplates.filter((template) => {
    const businessTypes = template.businessTypes as string[]
    const allowedTiers = template.allowedTiers as string[]
    
    const hasBusinessType = Array.isArray(businessTypes) && businessTypes.includes(businessType)
    const hasTier = Array.isArray(allowedTiers) && allowedTiers.includes(tier)
    
    return hasBusinessType && hasTier
  })

  // Since activeTemplates is ordered by sortOrder, matches is also ordered by sortOrder.
  // Return the first match.
  if (matches.length > 0) {
    return matches[0]
  }

  // 2. Fallback to default active template
  const defaultTemplate = activeTemplates.find((template) => template.isDefault)
  if (defaultTemplate) {
    return defaultTemplate
  }

  // 3. Absolute fallback to the first active template
  return activeTemplates[0] || null
}
