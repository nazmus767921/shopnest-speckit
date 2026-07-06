## 1. Database & Schema Foundation

- [x] 1.1 Create Supabase migration: add `store_templates` table (id, slug, name, description, preview_image_url, business_types JSONB, allowed_tiers JSONB, is_active, is_default, sort_order, created_at, updated_at) with RLS policies (public read, superadmin write)
- [x] 1.2 Create Supabase migration: rename `merchants.theme` column to `merchants.template`, migrate values (`"default"` → `"general"`, `"cinematic"` → `"general"`)
- [x] 1.3 Seed `store_templates` with two rows: `general` (is_default=true, allowed_tiers=["starter","growth","pro"], business_types=["general","electronics","beauty","food"]) and `fashion` (allowed_tiers=["growth","pro"], business_types=["clothing","accessories","shoes"])
- [x] 1.4 Add `storeTemplates` Drizzle schema definition in `db/schema.ts` and update `merchants` table to use `template` column instead of `theme`
- [x] 1.5 Write DB query functions: `getActiveTemplates()`, `getTemplatesForTier(tier)`, `getTemplateBySlug(slug)`, `resolveTemplateForBusinessType(businessType, tier)` in `db/queries/templates.ts`
- [x] 1.6 Write tests for template query functions (resolve logic, tier filtering, fallback chain)

## 2. Template Data Contract & Registry

- [x] 2.1 Create `templates/types.ts` with `TemplateModule`, `HomePageProps`, `PLPProps`, `PDPProps`, `CartPageProps`, `NavbarProps`, `FooterProps`, and `StoreData` interfaces
- [x] 2.2 Create `templates/registry.ts` with `getTemplate(slug)` function that returns the matching module or falls back to general
- [x] 2.3 Write tests for template registry (valid slug resolution, unknown slug fallback, type contract validation)

## 3. Per-Template DESIGN.md Files

- [x] 3.1 Create `designmd/DESIGN-general.md` — extract and document the complete design system from current `.storefront-theme-default` CSS tokens (colors, typography, spacing, component styles, do's/don't)
- [x] 3.2 Create `designmd/DESIGN-fashion.md` — define the fashion template's complete design system (editorial typography, color palette, spacing philosophy, component tokens, lookbook aesthetics, do's/don'ts)

## 4. Shared Building Blocks Extraction

- [x] 4.1 Create `components/storefront/shared/` directory and move/refactor existing shared logic: `AddToCartButton`, `BuyNowButton`, `QuantityAdjuster` (from CartItemRow), `CartIconButton`
- [x] 4.2 Extract `ProductGrid` shared block — accepts products array, column config, and renders using a passed `renderCard` prop or children
- [x] 4.3 Extract `ImageGallery` shared block from `StorefrontImageGallery` — gallery with thumbnail strip, suitable for both templates
- [x] 4.4 Extract `VariantPicker` shared block from `variant-selector/` — color swatches and size pills with configurable styling
- [x] 4.5 Extract `PriceDisplay` shared block — price, compare-at-price, discount badge logic
- [x] 4.6 Extract `ReviewSection` shared block from `ProductTabs` — reviews list with summary, usable independently
- [x] 4.7 Extract `FilterSidebar` shared block from `ProductFilters` — accordion filters for categories, price, colors, sizes
- [x] 4.8 Extract `Breadcrumbs` shared block
- [x] 4.9 Extract `NewsletterSignup` shared block from footer newsletter section

## 5. General Template Module

- [x] 5.1 Create `templates/general/` directory structure with `index.ts` barrel export implementing `TemplateModule`
- [x] 5.2 Create `templates/general/styles.css` — extract `.storefront-theme-default` CSS tokens from `globals.css` into `.storefront-template-general` scoped stylesheet
- [x] 5.3 Build `templates/general/GeneralHomePage.tsx` — refactor current `page.tsx` home content into template component accepting `HomePageProps`
- [x] 5.4 Build `templates/general/GeneralPLP.tsx` — refactor current PLP into template component with filter sidebar + 3-col product grid
- [x] 5.5 Build `templates/general/GeneralPDP.tsx` — refactor current PDP into template component with two-column gallery + details layout
- [x] 5.6 Build `templates/general/GeneralNavbar.tsx` — refactor `StorefrontNavbar` into general template's navbar (logo, search, cart, category links)
- [x] 5.7 Build `templates/general/GeneralFooter.tsx` — refactor current footer from layout.tsx into general template's footer component
- [x] 5.8 Build `templates/general/GeneralCartPage.tsx` — refactor `CartClientPage` for use as general template's cart (shared implementation with template tokens)
- [x] 5.9 Create template-specific components in `templates/general/components/` (GeneralHeroBanner, GeneralCategoryGrid, GeneralProductCard)
- [ ] 5.10 Verify general template renders identically to current storefront (visual regression)

## 6. Fashion Template Module

- [x] 6.1 Create `templates/fashion/` directory structure with `index.ts` barrel export implementing `TemplateModule`
- [x] 6.2 Create `templates/fashion/styles.css` — fashion template CSS tokens under `.storefront-template-fashion` (editorial typography, dark footer canvas, fashion color palette per DESIGN-fashion.md)
- [x] 6.3 Build `templates/fashion/FashionHomePage.tsx` — full-bleed editorial hero, asymmetric category grid, new arrivals carousel, trending lookbook grid, newsletter band
- [x] 6.4 Build `templates/fashion/FashionPLP.tsx` — portrait-oriented 3-col product cards, collapsible filter sidebar, no add-to-cart on cards, color swatch indicators
- [x] 6.5 Build `templates/fashion/FashionPDP.tsx` — 60/40 gallery+details layout, prominent color swatches as circles, inverted size pills, "Complete the Look" carousel, reviews section
- [x] 6.6 Build `templates/fashion/FashionNavbar.tsx` — minimal editorial navbar, centered/left logo, sparse nav items (Shop, New In), search overlay, cart badge
- [x] 6.7 Build `templates/fashion/FashionFooter.tsx` — dark canvas footer, display typography newsletter heading, light text on dark, social icons, payment badges
- [x] 6.8 Build fashion-specific components in `templates/fashion/components/` (FashionEditorialHero, FashionLookbookCard, FashionColorSwatchRow, FashionProductCard)
- [ ] 6.9 Verify fashion template renders correctly with sample store data against DESIGN-fashion.md specifications

## 7. Storefront Route Refactoring (Thin Resolvers)

- [x] 7.1 Refactor `app/(storefront)/[subdomain]/layout.tsx` — resolve merchant template, get template module from registry, render template's Navbar + children + Footer, apply `.storefront-template-<slug>` wrapper class
- [x] 7.2 Refactor `app/(storefront)/[subdomain]/page.tsx` — thin resolver: fetch data, render `<template.HomePage>`
- [x] 7.3 Refactor `app/(storefront)/[subdomain]/products/page.tsx` — thin resolver: fetch data, render `<template.PLP>`
- [x] 7.4 Refactor `app/(storefront)/[subdomain]/product/[slug]/page.tsx` — thin resolver: fetch data, render `<template.PDP>`
- [x] 7.5 Update cart/checkout/orders pages to use shared implementation with template CSS tokens (no template-specific component swap)
- [x] 7.6 Add `?template_preview=<slug>` support in layout.tsx — owner-only preview override
- [x] 7.7 Update middleware/proxy to pass `x-merchant-template` header alongside existing headers
- [x] 7.8 Remove old `.storefront-theme-default` and `.storefront-theme-cinematic` CSS blocks from `globals.css`

## 8. Merchant Dashboard — Template Gallery

- [ ] 8.1 Create `getAvailableTemplatesForMerchant(merchantId)` server action — returns templates with availability status based on merchant's tier
- [ ] 8.2 Build template gallery UI component for dashboard settings (template cards with preview thumbnail, name, description, Preview/Apply buttons, lock icons for unavailable templates)
- [ ] 8.3 Create `applyTemplate(merchantId, templateSlug)` server action — validates tier access, updates `merchants.template`, returns success/error
- [ ] 8.4 Add confirmation dialog before template switch ("Your store will now use the Fashion template")
- [ ] 8.5 Replace existing theme selection UI in store settings with the new template gallery
- [ ] 8.6 Write tests for template apply server action (tier validation, successful apply, rejection)

## 9. SuperAdmin — Template Management

- [ ] 9.1 Build superadmin template management page — list all templates with status, tier badges, business type tags
- [ ] 9.2 Build template edit form — name, description, preview image upload, business_types multi-select, allowed_tiers checkboxes, active/draft toggle
- [ ] 9.3 Create server actions: `updateTemplate(id, data)`, `toggleTemplateActive(id, isActive)`
- [ ] 9.4 Write tests for superadmin template actions (update, toggle, is_default constraint)

## 10. Onboarding — Business Type Auto-Assignment

- [ ] 10.1 Add business type selection step to the onboarding flow — radio/card selection UI with business type options
- [ ] 10.2 Create `resolveAndAssignTemplate(merchantId, businessType)` server action — queries `store_templates`, resolves best-fit template, updates merchant record
- [ ] 10.3 Integrate auto-assignment into the onboarding completion flow — after business type selection, assign template before redirecting to dashboard
- [ ] 10.4 Write tests for auto-assignment logic (matching, tier filtering, fallback chain)

## 11. Cleanup & Migration Safety

- [ ] 11.1 Update all references to `merchant.theme` across the codebase to use `merchant.template`
- [ ] 11.2 Update `db/queries/merchants.ts` — `updateMerchantSettings` to accept `template` instead of `theme`
- [ ] 11.3 Remove old theme-related code paths (theme dropdown in settings, cinematic theme CSS)
- [ ] 11.4 Verify no broken references to `storefront-theme-*` CSS classes remain
- [ ] 11.5 End-to-end verification: create a test store, go through onboarding with "clothing" business type, verify fashion template renders, switch to general via settings, verify general template renders
