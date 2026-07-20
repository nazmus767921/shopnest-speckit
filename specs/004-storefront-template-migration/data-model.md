# Data Model: Storefront Template Architecture Migration

**Date**: 2026-07-18 | **Spec**: [spec.md](spec.md) | **Research**: [research.md](research.md)

---

## Entity Changes Overview

This migration modifies 3 existing entities and adds 1 new concept. No new database tables are created.

| Entity | Change Type | Description |
|--------|------------|-------------|
| `StorefrontSection` (types) | MODIFY | Add 3 content types, rename 1, consolidate 3→1, strip layout/style fields |
| `storefront_sections` (DB) | DATA MIGRATION | Update sectionKey values, consolidate rows, seed new sections |
| `merchants` (DB) | MODIFY | Change `template` column default from `"general"` to `"elegance"` |
| `SectionCatalog` (new) | NEW (code only) | Core/optional classification metadata, fixed order, no DB table |

---

## 1. StorefrontSection Content Types

### Current State (7 types)

```
HeroContent { title, subtitle?, buttonText?, buttonLink?, imageUrl?, overlayOpacity? }
AnnouncementBarContent { text, link?, backgroundColor?, textColor? }
CategoryShowcaseContent { title, categoryIds[], layout? }
AboutContent { title, description, imageUrl?, buttonText?, buttonLink? }
ProductGridContent { title, gridType, productIds? }
FaqContent { heading?, questions[] }
FooterContent { storeDescription?, storeAddress?, socialLinks?, showPaymentBadges, copyrightText? }
```

### Target State (10 types)

#### HeroContent (MODIFIED — removed overlayOpacity)
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | `string` | Yes | `min(1)` |
| `subtitle` | `string` | No | — |
| `buttonText` | `string` | No | — |
| `buttonLink` | `string` | No | — |
| `imageUrl` | `string` | No | `url()` or empty string |

**Removed**: `overlayOpacity` (template-controlled visual styling)

#### AnnouncementBarContent (MODIFIED — removed colors)
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `text` | `string` | Yes | `min(1)` |
| `link` | `string` | No | — |

**Removed**: `backgroundColor`, `textColor` (template-controlled colors)

#### CategoryShowcaseContent (MODIFIED — removed layout)
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | `string` | Yes | `min(1)` |
| `categoryIds` | `string[]` | No | `default([])` |

**Removed**: `layout: 'grid' | 'mosaic'` (template-controlled layout)

#### FeaturedProductsContent (NEW — replaces ProductGridContent)
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | `string` | Yes | `min(1)` |
| `gridType` | `enum` | Yes | `'new_arrivals' \| 'featured' \| 'exclusive' \| 'manual_selection'` |
| `productIds` | `string[]` | No | Only used when `gridType = 'manual_selection'` |

**Note**: `gridType` is retained because it's a data source selection (content), not a layout choice (design).

#### PromoBannerContent (NEW)
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | `string` | Yes | `min(1)` |
| `subtitle` | `string` | No | — |
| `buttonText` | `string` | No | — |
| `buttonLink` | `string` | No | — |
| `imageUrl` | `string` | No | `url()` or empty string |

#### BrandStoryContent (RENAMED from AboutContent)
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | `string` | Yes | `min(1)` |
| `description` | `string` | Yes | `min(1)` |
| `imageUrl` | `string` | No | `url()` or empty string |
| `buttonText` | `string` | No | — |
| `buttonLink` | `string` | No | — |

**No field changes** — only type name and section key renamed.

#### TestimonialsContent (NEW)
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `heading` | `string` | No | — |
| `testimonials` | `Testimonial[]` | No | `default([])` |

**Testimonial** (nested object):
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | `string` | Yes | `min(1)` |
| `text` | `string` | Yes | `min(1)` |
| `rating` | `number` | No | `min(1).max(5)` |
| `avatarUrl` | `string` | No | `url()` or empty string |

#### NewsletterContent (NEW)
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `heading` | `string` | No | — |
| `subheading` | `string` | No | — |
| `placeholder` | `string` | No | Default: `"Enter your email"` |
| `buttonText` | `string` | No | Default: `"Subscribe"` |

#### FaqContent (UNCHANGED)
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `heading` | `string` | No | — |
| `questions` | `FaqQuestion[]` | No | `default([])` |

#### FooterContent (UNCHANGED)
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `storeDescription` | `string` | No | — |
| `storeAddress` | `string` | No | — |
| `socialLinks` | `Record<string, string>` | No | — |
| `showPaymentBadges` | `boolean` | No | `default(true)` |
| `copyrightText` | `string` | No | — |

---

## 2. Section Catalog (Code-Only Entity)

This is a new TypeScript constant — not a database table. It defines the universal section catalog with metadata.

```
SectionCatalogEntry {
  key: string              // e.g., "hero"
  classification: "core" | "optional"
  defaultSortOrder: number // Fixed position in template
  label: string            // Human-readable name for dashboard
  description: string      // Tooltip/help text
}
```

### Fixed Catalog

| key | classification | defaultSortOrder | label |
|-----|---------------|-----------------|-------|
| `announcement_bar` | optional | 0 | Announcement Bar |
| `hero` | core | 1 | Hero Banner |
| `category_showcase` | core | 2 | Category Showcase |
| `featured_products` | core | 3 | Featured Products |
| `promo_banner` | optional | 4 | Promotional Banner |
| `brand_story` | optional | 5 | Brand Story |
| `testimonials` | optional | 6 | Testimonials |
| `newsletter` | optional | 7 | Newsletter |
| `faq` | optional | 8 | FAQ |
| `footer` | core | 9999 | Footer |

---

## 3. TemplateModule Interface Extension

### Current State
```
TemplateModule {
  HomePage, PLP, PDP, CartPage, Navbar, Footer, StandardPage
}
```

### Target State
```
TemplateModule {
  // Page components (unchanged)
  HomePage, PLP, PDP, CartPage, Navbar, Footer, StandardPage

  // Section components (NEW)
  sections: Partial<Record<SectionKey, React.ComponentType<SectionProps>>>
}
```

Each template registers its section overrides. Missing keys fall back to shared default implementations. The `SectionProps` interface provides `content: Record<string, any>`, `merchantId: string`, `subdomain: string`.

---

## 4. Database Migrations

### Migration 1: merchants.template default
```sql
ALTER TABLE merchants ALTER COLUMN template SET DEFAULT 'elegance';
UPDATE merchants SET template = 'elegance' WHERE template IN ('general', 'fashion', 'retail');
```

### Migration 2: storefront_sections key updates
```sql
-- Rename about → brand_story
UPDATE storefront_sections SET section_key = 'brand_story' WHERE section_key = 'about';

-- Keep product_grid_featured as featured_products
UPDATE storefront_sections SET section_key = 'featured_products' WHERE section_key = 'product_grid_featured';

-- Delete redundant product grid sections
DELETE FROM storefront_sections WHERE section_key IN ('product_grid_new_arrivals', 'product_grid_exclusive');
```

### Migration 3: store_templates registry
```sql
-- Delete old templates
DELETE FROM store_templates WHERE slug IN ('general', 'retail');

-- Rename fashion → elegance
UPDATE store_templates SET slug = 'elegance', name = 'Elegance' WHERE slug = 'fashion';
```

### Migration 4: Seed new sections for existing merchants
For each merchant that doesn't have `promo_banner`, `testimonials`, or `newsletter` sections, insert default rows with `is_visible = false`.

---

## 5. Default Section Content (Seeding)

New defaults for the 3 added sections:

### promo_banner (hidden by default)
```json
{
  "title": "Special Offer",
  "subtitle": "Limited time deals on selected items",
  "buttonText": "Shop Now",
  "buttonLink": "/products",
  "imageUrl": ""
}
```

### testimonials (hidden by default)
```json
{
  "heading": "What Our Customers Say",
  "testimonials": []
}
```

### newsletter (hidden by default)
```json
{
  "heading": "Stay Updated",
  "subheading": "Subscribe to our newsletter for the latest updates and offers",
  "placeholder": "Enter your email",
  "buttonText": "Subscribe"
}
```

---

## 6. Validation Rules (Zod Schema Changes)

### Schemas to ADD
- `promoBannerContentSchema` — mirrors heroContentSchema without overlayOpacity
- `testimonialsContentSchema` — with nested testimonial array validation
- `newsletterContentSchema` — simple string fields with defaults
- `featuredProductsContentSchema` — replaces missing productGrid schema, validates gridType enum

### Schemas to MODIFY
- `heroContentSchema` — remove `overlayOpacity` field
- `announcementBarContentSchema` — remove `backgroundColor`, `textColor` fields
- `categoryShowcaseContentSchema` — remove `layout` field

### Schemas to RENAME
- `aboutContentSchema` → `brandStoryContentSchema` (no field changes)

### Schemas to DELETE
- None (the generic `storefrontSectionInputSchema` stays as the wrapper)

### Server-side Enforcement (NEW)
- `saveStorefrontSectionsAction` must reject `isVisible: false` for core sections (`hero`, `category_showcase`, `featured_products`, `footer`)
- `saveStorefrontSectionsAction` must ignore merchant-provided `sortOrder` and use the fixed catalog order instead
