/**
 * Section Catalog — the universal section catalog for all templates.
 *
 * This is the SINGLE SOURCE OF TRUTH for:
 * - The 10 universal section types
 * - Core vs Optional classification
 * - Fixed display order (sortOrder)
 * - Human-readable labels and descriptions
 *
 * Templates MUST render all 10 sections. Merchants can toggle Optional sections.
 * Core sections are ALWAYS visible.
 */

/** Valid section keys — the exhaustive set of 10 sections */
export const SECTION_KEYS = [
  "announcement_bar",
  "hero",
  "category_showcase",
  "featured_products",
  "promo_banner",
  "brand_story",
  "testimonials",
  "newsletter",
  "faq",
  "footer",
] as const

export type SectionKey = (typeof SECTION_KEYS)[number]

/** Classification: core sections are always visible, optional can be toggled */
export type SectionClassification = "core" | "optional"

export interface SectionCatalogEntry {
  key: SectionKey
  classification: SectionClassification
  defaultSortOrder: number
  label: string
  description: string
}

/**
 * The fixed catalog of all 10 sections.
 * Order here defines the display order on the storefront.
 */
export const SECTION_CATALOG: readonly SectionCatalogEntry[] = [
  {
    key: "announcement_bar",
    classification: "optional",
    defaultSortOrder: 0,
    label: "Announcement Bar",
    description: "Top-of-page promotional text strip",
  },
  {
    key: "hero",
    classification: "core",
    defaultSortOrder: 1,
    label: "Hero Banner",
    description: "Primary hero banner with image, headline, and call-to-action",
  },
  {
    key: "category_showcase",
    classification: "core",
    defaultSortOrder: 2,
    label: "Category Showcase",
    description: "Browse-by-category navigation grid",
  },
  {
    key: "featured_products",
    classification: "core",
    defaultSortOrder: 3,
    label: "Featured Products",
    description: "Curated product grid showcasing selected products",
  },
  {
    key: "promo_banner",
    classification: "optional",
    defaultSortOrder: 4,
    label: "Promotional Banner",
    description: "Mid-page sale or discount callout",
  },
  {
    key: "brand_story",
    classification: "optional",
    defaultSortOrder: 5,
    label: "Brand Story",
    description: "About section with brand narrative and image",
  },
  {
    key: "testimonials",
    classification: "optional",
    defaultSortOrder: 6,
    label: "Testimonials",
    description: "Customer reviews and social proof",
  },
  {
    key: "newsletter",
    classification: "optional",
    defaultSortOrder: 7,
    label: "Newsletter",
    description: "Email capture subscription form",
  },
  {
    key: "faq",
    classification: "optional",
    defaultSortOrder: 8,
    label: "FAQ",
    description: "Frequently asked questions accordion",
  },
  {
    key: "footer",
    classification: "core",
    defaultSortOrder: 9999,
    label: "Footer",
    description: "Store info, links, contact details, and social media",
  },
] as const

// ── Derived helpers ──────────────────────────────────────────────────────────

/** Set of core section keys */
export const CORE_SECTION_KEYS = new Set<SectionKey>(
  SECTION_CATALOG.filter((s) => s.classification === "core").map((s) => s.key)
)

/** Set of optional section keys */
export const OPTIONAL_SECTION_KEYS = new Set<SectionKey>(
  SECTION_CATALOG.filter((s) => s.classification === "optional").map((s) => s.key)
)

/** Map from sectionKey → defaultSortOrder */
export const SECTION_SORT_ORDER: Record<SectionKey, number> = Object.fromEntries(
  SECTION_CATALOG.map((s) => [s.key, s.defaultSortOrder])
) as Record<SectionKey, number>

/** Get the catalog entry for a section key */
export function getSectionCatalogEntry(key: string): SectionCatalogEntry | undefined {
  return SECTION_CATALOG.find((s) => s.key === key)
}

/** Check if a section key is a core (always-visible) section */
export function isCoreSection(key: string): boolean {
  return CORE_SECTION_KEYS.has(key as SectionKey)
}

/** Check if a section key is valid */
export function isValidSectionKey(key: string): key is SectionKey {
  return SECTION_KEYS.includes(key as SectionKey)
}
