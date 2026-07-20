# Quickstart Validation Guide: Storefront Template Architecture Migration

**Date**: 2026-07-18 | **Spec**: [spec.md](spec.md) | **Data Model**: [data-model.md](data-model.md)

---

## Prerequisites

- Node.js 20+, bun package manager
- Supabase Postgres database with existing schema
- Project dependencies installed (`bun install`)

---

## Validation Scenarios

### V1: Section Catalog Integrity

**What to verify**: The 10 universal section types are correctly defined with proper classification.

**Steps**:
1. Run section catalog unit tests:
   ```bash
   bun run vitest run lib/storefront-sections/section-catalog.test.ts
   ```
2. Expected: Tests confirm exactly 10 sections exist — 4 core, 6 optional
3. Expected: Core sections reject `isVisible: false`
4. Expected: `defaultSortOrder` values match the fixed catalog order

---

### V2: Content Schema Validation

**What to verify**: New Zod schemas validate correctly, stripped fields are rejected, data source fields are preserved.

**Steps**:
1. Run validation schema tests:
   ```bash
   bun run vitest run lib/validations/storefront-sections.test.ts
   ```
2. Expected outcomes:
   - `heroContentSchema` accepts `{ title, subtitle, buttonText, buttonLink, imageUrl }` — rejects `overlayOpacity`
   - `announcementBarContentSchema` accepts `{ text, link }` — rejects `backgroundColor`, `textColor`
   - `categoryShowcaseContentSchema` accepts `{ title, categoryIds }` — rejects `layout`
   - `featuredProductsContentSchema` accepts `{ title, gridType, productIds }` — validates `gridType` enum
   - `promoBannerContentSchema` validates title + optional fields
   - `testimonialsContentSchema` validates nested testimonial array with rating `1-5`
   - `newsletterContentSchema` validates with defaults for `placeholder` and `buttonText`
   - `brandStoryContentSchema` validates same fields as old `aboutContentSchema`

---

### V3: Template Registry

**What to verify**: Only one template registered, correct fallback, old templates removed.

**Steps**:
1. Run registry tests:
   ```bash
   bun run vitest run templates/registry.test.ts
   ```
2. Expected:
   - `getTemplate("elegance")` returns the elegance module
   - `getTemplate("general")` falls back to elegance (not crash)
   - `getTemplate("fashion")` falls back to elegance
   - `getTemplate("retail")` falls back to elegance
   - `Object.keys(templates)` returns `["elegance"]`

---

### V4: TemplateModule Section Components

**What to verify**: The elegance template declares section components, and the SectionRenderer resolves them correctly.

**Steps**:
1. Run template module tests:
   ```bash
   bun run vitest run templates/elegance/index.test.ts
   ```
2. Expected:
   - `eleganceModule.sections` is defined and contains entries for per-template sections (`hero`, `category_showcase`, `featured_products`, `promo_banner`, `footer`)
   - Shared sections (`announcement_bar`, `brand_story`, `testimonials`, `newsletter`, `faq`) may or may not be in `sections` — they fall back to shared defaults

---

### V5: Section Save Action — Core Enforcement

**What to verify**: Server action prevents hiding core sections and ignores merchant-provided sortOrder.

**Steps**:
1. Run action integration tests:
   ```bash
   bun run vitest run app/actions/storefront-sections.test.ts
   ```
2. Expected:
   - Saving sections with `hero.isVisible = false` returns an error
   - Saving sections with custom `sortOrder` values → saved sections have catalog-defined sortOrder instead
   - Saving sections with `faq.isVisible = false` succeeds (FAQ is optional)

---

### V6: Default Section Seeding

**What to verify**: New merchants get all 10 sections seeded with correct defaults.

**Steps**:
1. Run seeding tests:
   ```bash
   bun run vitest run lib/storefront-sections/defaults.test.ts
   ```
2. Expected:
   - `defaultStorefrontSections` has exactly 10 entries
   - Core sections have `isVisible: true`
   - New optional sections (`promo_banner`, `testimonials`, `newsletter`) have `isVisible: false`
   - Section keys match the catalog: no `about`, no `product_grid_*`

---

### V7: Storefront Homepage Rendering (Manual)

**What to verify**: The storefront homepage renders all visible sections in fixed order with the elegance template's visual style.

**Steps**:
1. Start the dev server (with user permission):
   ```bash
   bun dev
   ```
2. Visit a merchant's storefront URL
3. Verify:
   - Sections render in order: announcement_bar → hero → category_showcase → featured_products → ... → footer
   - Per-template sections (hero, category_showcase, featured_products) use template-specific components
   - Shared sections (brand_story, faq) use shared components with template-scoped CSS
   - Hidden optional sections are not rendered (no empty gaps)
   - Color rhythm alternates correctly between visible sections

---

### V8: Dashboard Section Editor (Manual)

**What to verify**: Dashboard shows 10 sections in fixed order, no drag-and-drop, core/optional controls correct.

**Steps**:
1. Start the dev server and visit `/dashboard/templates`
2. Verify:
   - All 10 sections appear in the fixed catalog order
   - No drag handles visible
   - Core sections (hero, category_showcase, featured_products, footer) show lock icons — no toggle
   - Optional sections show on/off toggle switch
   - Clicking any section expands an accordion content editor
   - Section editors show only text/image fields — no layout selectors, no color pickers
   - Live preview updates when content is edited
   - Save persists changes and revalidates storefront cache

---

### V9: Database Migration (Manual)

**What to verify**: DB migrations update section keys, template references, and seed new sections.

**Steps**:
1. Run Drizzle migrations:
   ```bash
   bun run db:migrate
   ```
2. Verify in Supabase dashboard or `psql`:
   - `merchants.template` default is `'elegance'`
   - No rows in `storefront_sections` have `section_key IN ('about', 'product_grid_new_arrivals', 'product_grid_exclusive')`
   - Rows previously with `section_key = 'about'` now have `section_key = 'brand_story'`
   - Rows previously with `section_key = 'product_grid_featured'` now have `section_key = 'featured_products'`
   - `store_templates` has one row with `slug = 'elegance'`

---

## Test Execution Summary

| Scenario | Type | Command/Action |
|----------|------|----------------|
| V1 | Unit | `bun run vitest run lib/storefront-sections/section-catalog.test.ts` |
| V2 | Unit | `bun run vitest run lib/validations/storefront-sections.test.ts` |
| V3 | Unit | `bun run vitest run templates/registry.test.ts` |
| V4 | Unit | `bun run vitest run templates/elegance/index.test.ts` |
| V5 | Integration | `bun run vitest run app/actions/storefront-sections.test.ts` |
| V6 | Unit | `bun run vitest run lib/storefront-sections/defaults.test.ts` |
| V7 | Manual | Visit storefront URL, inspect sections |
| V8 | Manual | Visit `/dashboard/templates`, inspect editor |
| V9 | Manual | Run migrations, inspect DB |
