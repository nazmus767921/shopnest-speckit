"use server"

import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getCachedStorefrontSections } from "@/lib/cache/storefront"
import { saveStorefrontSections } from "@/db/queries/storefront-sections"
import { updateStorefrontSectionsSchema } from "@/lib/validations/storefront-sections"
import { defaultStorefrontSections } from "@/lib/storefront-sections/defaults"
import { isCoreSection, SECTION_SORT_ORDER, SectionKey } from "@/lib/storefront-sections/section-catalog"
import {
  heroContentSchema,
  announcementBarContentSchema,
  categoryShowcaseContentSchema,
  featuredProductsContentSchema,
  promoBannerContentSchema,
  brandStoryContentSchema,
  testimonialsContentSchema,
  newsletterContentSchema,
  faqContentSchema,
  footerContentSchema
} from "@/lib/validations/storefront-sections"
import { revalidateTag } from "next/cache"

export async function saveStorefrontSectionsAction(rawSections: any) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const merchant = await getMerchantByOwnerId(session.user.id)
    if (!merchant) {
      return { success: false, error: "Merchant not found" }
    }

    const parseResult = updateStorefrontSectionsSchema.safeParse(rawSections)
    if (!parseResult.success) {
      return { success: false, error: "Validation error: " + parseResult.error.issues[0].message }
    }

    const validatedSections = []
    for (const section of parseResult.data) {
      // Enforce core section visibility
      if (isCoreSection(section.sectionKey) && !section.isVisible) {
        section.isVisible = true 
      }
      
      // Override sort order with catalog defaults
      const defaultOrder = SECTION_SORT_ORDER[section.sectionKey as SectionKey]
      if (typeof defaultOrder === "number") {
        section.sortOrder = defaultOrder
      }

      // Validate content payload
      let contentValidation
      switch (section.sectionKey as SectionKey) {
        case "hero": contentValidation = heroContentSchema.safeParse(section.content); break
        case "announcement_bar": contentValidation = announcementBarContentSchema.safeParse(section.content); break
        case "category_showcase": contentValidation = categoryShowcaseContentSchema.safeParse(section.content); break
        case "featured_products": contentValidation = featuredProductsContentSchema.safeParse(section.content); break
        case "promo_banner": contentValidation = promoBannerContentSchema.safeParse(section.content); break
        case "brand_story": contentValidation = brandStoryContentSchema.safeParse(section.content); break
        case "testimonials": contentValidation = testimonialsContentSchema.safeParse(section.content); break
        case "newsletter": contentValidation = newsletterContentSchema.safeParse(section.content); break
        case "faq": contentValidation = faqContentSchema.safeParse(section.content); break
        case "footer": contentValidation = footerContentSchema.safeParse(section.content); break
        default: contentValidation = { success: true, data: section.content }
      }

      if (!contentValidation.success) {
        return { success: false, error: `Validation error in ${section.sectionKey}: ${contentValidation.error.issues[0].message}` }
      }

      section.content = contentValidation.data
      validatedSections.push(section)
    }

    await saveStorefrontSections(merchant.id, validatedSections)

    revalidateTag(`storefront-${merchant.id}`, "max")

    return { success: true }
  } catch (error: any) {
    console.error("Failed to save storefront sections:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function seedDefaultSectionsAction() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const merchant = await getMerchantByOwnerId(session.user.id)
    if (!merchant) {
      return { success: false, error: "Merchant not found" }
    }

    // Check if merchant already has sections
    const existingSections = await getCachedStorefrontSections(merchant.id)
    if (existingSections.length > 0) {
      return { success: true, seeded: false }
    }

    // Seed defaults
    await saveStorefrontSections(merchant.id, defaultStorefrontSections)
    
    revalidateTag(`storefront-${merchant.id}`, "max")

    return { success: true, seeded: true }
  } catch (error: any) {
    console.error("Failed to seed default sections:", error)
    return { success: false, error: "Internal server error" }
  }
}
