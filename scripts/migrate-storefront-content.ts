import { db } from "@/db"
import { sql } from "drizzle-orm"
import { defaultHeroContent, defaultAboutContent, defaultAnnouncementBarContent, defaultCategoryShowcaseContent } from "@/lib/storefront-sections/defaults"

/**
 * One-time data migration script for centralize-storefront-content.
 * This script MUST be run on production BEFORE applying the Drizzle migration (0030)
 * that drops the legacy presentation columns from the merchants table.
 */
async function main() {
  console.log("Starting data migration: migrating legacy merchant fields to storefront_sections...")

  // Fetch all merchants with their legacy fields using raw SQL
  // because the Drizzle schema no longer has these columns.
  const merchants = await db.execute(sql`
    SELECT 
      id, 
      name,
      hero_image_url, 
      subtitle, 
      store_description, 
      store_address, 
      social_links, 
      custom_faqs
    FROM merchants
  `)

  let migratedCount = 0

  for (const merchant of merchants.rows) {
    const merchantId = merchant.id as string
    const merchantName = merchant.name as string
    
    // Parse JSON fields if they are strings (depends on postgres driver)
    const socialLinks = typeof merchant.social_links === 'string' ? JSON.parse(merchant.social_links) : merchant.social_links
    const customFaqs = typeof merchant.custom_faqs === 'string' ? JSON.parse(merchant.custom_faqs) : merchant.custom_faqs

    const heroContent = {
      ...defaultHeroContent,
      title: `Welcome to ${merchantName}`,
      subtitle: (merchant.subtitle as string) || defaultHeroContent.subtitle,
      imageUrl: (merchant.hero_image_url as string) || defaultHeroContent.imageUrl,
    }

    const faqContent = {
      heading: "Frequently Asked Questions",
      questions: Array.isArray(customFaqs) && customFaqs.length > 0
        ? customFaqs
        : [{ question: "What is your return policy?", answer: "We offer a 30-day return policy for unused items." }]
    }

    const footerContent = {
      storeDescription: (merchant.store_description as string) || `Welcome to ${merchantName}. We are committed to providing the best quality products.`,
      storeAddress: (merchant.store_address as string) || "",
      socialLinks: socialLinks || {},
      showPaymentBadges: true,
      copyrightText: `© ${new Date().getFullYear()} ${merchantName}. Powered by ShopNest.`
    }

    const sectionsToInsert = [
      { sectionKey: "announcement_bar", content: defaultAnnouncementBarContent, sortOrder: 0 },
      { sectionKey: "hero", content: heroContent, sortOrder: 1 },
      { sectionKey: "category_showcase", content: defaultCategoryShowcaseContent, sortOrder: 2 },
      { sectionKey: "about", content: defaultAboutContent, sortOrder: 3 },
      { sectionKey: "faq", content: faqContent, sortOrder: 7 },
      { sectionKey: "footer", content: footerContent, sortOrder: 9999 }
    ]

    for (const section of sectionsToInsert) {
      await db.execute(sql`
        INSERT INTO storefront_sections (id, merchant_id, section_key, content, sort_order, is_visible, created_at, updated_at)
        VALUES (
          gen_random_uuid(), 
          ${merchantId}, 
          ${section.sectionKey}, 
          ${JSON.stringify(section.content)}::jsonb, 
          ${section.sortOrder}, 
          true, 
          now(), 
          now()
        )
        ON CONFLICT (merchant_id, section_key) DO NOTHING
      `)
    }

    migratedCount++
  }

  console.log(`Data migration complete. Migrated ${migratedCount} merchants.`)
  process.exit(0)
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
