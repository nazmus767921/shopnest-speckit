## Why

ShopNest's storefront templates currently differ only in color scheme and typography — the homepage layout is structurally identical across templates (hero banner, product sliders, CTA, FAQs). The design vision in `DESIGN-fashion.md` calls for editorial sections (asymmetric mosaic, brand story, marquee) that don't exist yet. The current data model is flat — `heroImageUrl`, `subtitle`, and `storeDescription` live as columns on the `merchants` table with no mechanism for section-level homepage content that templates can render differently. Real fashion storefronts like SSENSE, COS, and Net-a-Porter have distinct homepage sections (editorial hero, brand story, lookbook mosaic) that make browsing feel like a magazine — not a generic product catalog. Merchants also need per-section control to toggle sections on/off and customize content for their specific storefront identity.

## What Changes

- **New `storefront_sections` database table**: A universal section-based content model with 4 section keys (`hero`, `announcement_bar`, `category_showcase`, `about`). Each merchant gets one row per section key with JSONB content, visibility toggle, and sort order. Sections are template-agnostic — the same data is rendered differently by each template.
- **Fashion template homepage redesign**: The `FashionHomePage` is rewritten to render 4 structurally distinct sections: full-bleed editorial hero with overlay text, scrolling announcement marquee strip, asymmetric category mosaic grid, and 50/50 brand story editorial split. Product sliders (new arrivals, featured) and FAQ accordion remain as auto-populated sections.
- **New dashboard "Templates" page**: A dedicated page at `dashboard/templates` consolidating the template picker (moved from Settings > Storefront Layout) and a section-by-section homepage editor with accordion panels and visibility toggle switches. Single "Save All Sections" action.
- **Section pre-seeding with placeholders**: When sections are first created, all 4 rows are inserted with sensible defaults and template-aware placeholder images from Supabase storage (`template-defaults/`). Sections default to `is_visible: true` so the storefront works immediately.
- **Hero section fallback**: The fashion template reads from the `hero` section first. The general template continues using flat `merchants.heroImageUrl`/`subtitle` fields until upgraded later.
- **Newsletter removed**: The newsletter dark band is removed from scope across all templates.

## Capabilities

### New Capabilities
- `storefront-sections-model`: The `storefront_sections` database table, CRUD queries, Zod validation schemas, TypeScript content types, default content seeding, and server actions for section management. The core data layer.
- `fashion-homepage-sections`: The fashion template's structurally distinct homepage — editorial hero, announcement marquee, category mosaic, and brand story components that render universal section data with fashion-specific editorial layouts.
- `templates-dashboard-page`: The merchant-facing "Templates" page in the dashboard — template picker (moved from settings), accordion section editors with visibility toggles, section content forms, and save flow.

### Modified Capabilities
- `storefront-template-fashion`: The fashion template home page layout is upgraded from a simple hero + product sliders to a section-driven homepage with distinct editorial sections. The `FashionHomePage` component is rewritten. Existing `FashionEditorialHero` and `FashionLookbookCard` components are replaced.
- `template-management`: The template picker UI is moved from the Settings > Storefront Layout tab to the new dedicated Templates page. The storefront settings tab retains only flat-field controls (hero image fallback, subtitle, description, address, social links, FAQs).

## Impact

- **Database**: New `storefront_sections` table with RLS. Migration to create table, indexes, and unique constraint.
- **Storefront routes**: `app/(storefront)/[subdomain]/page.tsx` adds a query to fetch visible sections and passes them to the template's `HomePage` component via an updated `HomePageProps` interface.
- **Templates**: `templates/types.ts` gains `StorefrontSection` type and updated `HomePageProps`. `templates/fashion/FashionHomePage.tsx` is rewritten. New section components added under `templates/fashion/sections/`.
- **Dashboard**: New `app/(dashboard)/dashboard/templates/` route. Template picker removed from `StoreSettingsForm`. Sidebar navigation updated with "Templates" link.
- **Deleted components**: `FashionEditorialHero.tsx` and `FashionLookbookCard.tsx` are replaced by the new section components.

---

## Design Decisions

### 1. Universal Sections, Template-Specific Rendering

Sections are **template-agnostic** in the database. Every merchant gets the same 4 section keys with the same content shape. The merchant's active template determines how sections render on the storefront.

**Why:** Data portability when switching templates. One dashboard editor for all templates. Adding a new template only requires new React components — no DB or editor changes.

```
┌───────────────────────────────────────────────────────┐
│                 storefront_sections                    │
│          (same 4 rows for every merchant)              │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Fashion template renders "hero" as:                  │
│    Full-bleed viewport image, Playfair overlay,       │
│    dark gradient, overlayOpacity applied              │
│                                                       │
│  General template renders "hero" as:                  │
│    Side-by-side card, image right, bold uppercase     │
│    (future — keeps flat fields for now)               │
│                                                       │
│  Same data → structurally different output            │
└───────────────────────────────────────────────────────┘
```

### 2. Hero Section: Section-First, Flat-Field Fallback

The existing `merchants.heroImageUrl` and `merchants.subtitle` flat columns remain. The fashion template reads from the `hero` section first; the general template continues reading flat fields until it's upgraded.

### 3. Newsletter Removed

The newsletter dark band from `DESIGN-fashion.md` is removed from scope across all templates. No email capture functionality is needed.

### 4. Templates Page Consolidation

The template/theme picker currently in Settings > Storefront Layout is moved to the new dedicated Templates page. This page becomes the single location for:
- Choosing which template the storefront uses
- Configuring all homepage section content
- Toggling section visibility

### 5. Pre-Seeded Default Content

When a merchant's sections are first created (on store creation or first visit to Templates page), all 4 sections are inserted with sensible defaults and placeholder images. Placeholder images are stored in Supabase storage under `template-defaults/`. Sections default to `is_visible: true` so the storefront works immediately.

---

## Technical Design

### Database: `storefront_sections` Table

```sql
CREATE TABLE storefront_sections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  section_key     TEXT NOT NULL,  -- "hero" | "announcement_bar" | "category_showcase" | "about"
  content         JSONB NOT NULL DEFAULT '{}',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_visible      BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT storefront_sections_unique UNIQUE (merchant_id, section_key)
);

CREATE INDEX storefront_sections_merchant_idx ON storefront_sections (merchant_id);

ALTER TABLE storefront_sections ENABLE ROW LEVEL SECURITY;
```

### Section Content Shapes (TypeScript)

```typescript
// ─── Hero ─────────────────────────────────────────────
type HeroContent = {
  imageUrl: string           // full-bleed background image
  heading: string            // store name or custom
  subheading: string | null  // tagline / seasonal message
  ctaText: string            // "Shop Now"
  ctaLink: string            // "/products"
  overlayOpacity: number     // 0.3–0.6 (fashion uses, general ignores)
}

// ─── Announcement Bar ─────────────────────────────────
type AnnouncementBarContent = {
  messages: Array<{
    text: string              // "Free shipping over ৳3000"
    link?: string             // optional click-through URL
  }>
  speed: "slow" | "normal" | "fast"
}

// ─── Category Showcase ────────────────────────────────
type CategoryShowcaseContent = {
  heading: string             // "Shop by Category"
  eyebrow: string             // "COLLECTIONS"
  tiles: Array<{
    imageUrl: string          // merchant-uploaded or placeholder
    label: string             // "Evening Wear"
    linkUrl: string           // "/products?category=xxx"
    categoryId?: string       // optional link to real category
  }>  // 2–4 tiles
}

// ─── About ────────────────────────────────────────────
type AboutContent = {
  eyebrow: string             // "OUR STORY"
  heading: string             // "Crafted with Intention"
  body: string                // 2–3 sentences
  imageUrl: string            // lifestyle / founder photo
  imagePosition: "left" | "right"
  ctaText?: string            // "Learn More"
  ctaLink?: string
}
```

### Fashion Homepage Section Flow

```
┌═══════════════════════════════════════════════════┐
║  FULL-BLEED EDITORIAL HERO                        ║
║  Viewport-height lifestyle image                  ║
║  Playfair Display heading overlay                 ║
║  Gradient + overlayOpacity control                ║
║  "Shop Now" pill CTA                              ║
╠═══════════════════════════════════════════════════╣
║  ANNOUNCEMENT MARQUEE STRIP                       ║
║  Scrolling text messages, thin editorial bar      ║
╠═══════════════════════════════════════════════════╣
║  ASYMMETRIC CATEGORY MOSAIC                       ║
║  ┌──────────────────┐ ┌──────────┐                ║
║  │                  │ │  SMALL   │                ║
║  │   LARGE (2/3)    │ ├──────────┤                ║
║  │                  │ │  SMALL   │                ║
║  └──────────────────┘ └──────────┘                ║
║  Overlay labels + "Explore" links                 ║
╠═══════════════════════════════════════════════════╣
║  NEW ARRIVALS CAROUSEL                            ║
║  (auto from products — existing ProductSlider)    ║
╠═══════════════════════════════════════════════════╣
║  BRAND STORY — 50/50 EDITORIAL SPLIT              ║
║  ┌───────────────┬────────────────┐               ║
║  │  LIFESTYLE    │  "Our Story"   │               ║
║  │  IMAGE        │  Body text     │               ║
║  │  (50%)        │  CTA pill      │               ║
║  └───────────────┴────────────────┘               ║
╠═══════════════════════════════════════════════════╣
║  CURATED EXCLUSIVES CAROUSEL                      ║
║  (auto from products — existing ProductSlider)    ║
╠═══════════════════════════════════════════════════╣
║  FAQ ACCORDION (existing, from store.customFaqs)  ║
╚═══════════════════════════════════════════════════╝
```

### Dashboard: Templates Page

**Route:** `dashboard/templates`

**Layout:**

```
┌──────────────────────────────────────────────────────┐
│  Templates                                            │
│                                                       │
│  ┌─── Choose Your Template ────────────────────────┐  │
│  │  ┌──────────┐  ┌──────────┐                     │  │
│  │  │ General  │  │ Fashion  │  (future templates) │  │
│  │  │   ✓      │  │          │                     │  │
│  │  └──────────┘  └──────────┘                     │  │
│  │  [Apply Template]                               │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  ┌─── Homepage Sections ───────────────────────────┐  │
│  │  Configure the sections on your storefront.     │  │
│  │                                                  │  │
│  │  ┌────────────────────────────── ◉ Visible ──┐  │  │
│  │  │ ▸ Hero Banner                              │  │  │
│  │  │   (collapsed — expand to edit fields)      │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────── ◉ Visible ──┐  │  │
│  │  │ ▸ Announcement Bar                         │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────── ◉ Visible ──┐  │  │
│  │  │ ▸ Category Showcase                        │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────── ◎ Hidden ───┐  │  │
│  │  │ ▸ About Your Brand          (greyed out)   │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │                                                  │  │
│  │  [Save All Sections]                             │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

- Each section is an **accordion panel** — collapsed by default, expand to see form fields
- **Toggle switch** at top-right of each panel header — controls `is_visible`
- When hidden: panel collapses, greys out, content is preserved
- **Single "Save All Sections"** button at bottom
- Template picker is at the top of the same page

### Storefront Rendering Changes

The storefront homepage (`app/(storefront)/[subdomain]/page.tsx`) adds a query to fetch visible sections, then passes them to the template's `HomePage` component:

```typescript
// HomePageProps updated
interface HomePageProps {
  store: StoreData
  sections: StorefrontSection[]    // NEW
  featuredProducts: Product[]
  categories: CategoryWithProducts[]
  newArrivals: Product[]
}
```

The `FashionHomePage` looks up sections by key and renders the appropriate component for each visible section. Missing sections are silently skipped.

### Sidebar Navigation Update

The dashboard sidebar gains a new **"Templates"** link (with a palette/layout icon). The template picker is removed from the existing Settings > Storefront Layout tab, leaving that tab for: hero image (flat field — general template fallback), subtitle, description, address, social links, FAQs.

---

## File Impact Summary

### New Files
- `db/migrations/XXXX_add_storefront_sections.sql` — migration for new table
- `db/queries/storefront-sections.ts` — CRUD queries
- `lib/validations/storefront-sections.ts` — Zod schemas for section content
- `lib/storefront-sections/defaults.ts` — default content + placeholder image URLs per section
- `lib/storefront-sections/types.ts` — TypeScript types for section content shapes
- `app/actions/storefront-sections.ts` — server actions for section CRUD
- `app/(dashboard)/dashboard/templates/page.tsx` — Templates page (RSC wrapper)
- `app/(dashboard)/dashboard/templates/TemplatesPageClient.tsx` — client component
- `templates/fashion/sections/FashionHero.tsx` — full-bleed editorial hero
- `templates/fashion/sections/FashionMarquee.tsx` — scrolling announcement strip
- `templates/fashion/sections/FashionCategoryMosaic.tsx` — asymmetric mosaic grid
- `templates/fashion/sections/FashionBrandStory.tsx` — 50/50 editorial split

### Modified Files
- `db/schema.ts` — add `storefrontSections` table definition
- `templates/types.ts` — add `StorefrontSection` type, update `HomePageProps`
- `templates/fashion/FashionHomePage.tsx` — rewrite to use sections
- `app/(storefront)/[subdomain]/page.tsx` — fetch sections, pass to template
- `app/(dashboard)/dashboard/settings/components/StoreSettingsForm.tsx` — remove template picker from storefront tab
- Dashboard sidebar components — add "Templates" nav link

### Deleted
- `templates/fashion/components/FashionEditorialHero.tsx` — replaced by `FashionHero.tsx`
- `templates/fashion/components/FashionLookbookCard.tsx` — replaced by mosaic tiles

---

## Open Questions

None — all design decisions were resolved during exploration.

## Dependencies

- Supabase storage bucket for placeholder images (`template-defaults/`)
- The existing `storefront-template-system` change (64/66 tasks complete) should be finished or stable before this begins
