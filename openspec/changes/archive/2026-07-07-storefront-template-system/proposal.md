## Why

ShopNest currently offers CSS-only theming (`.storefront-theme-default` / `.storefront-theme-cinematic`) that changes colors, fonts, and radii but renders every storefront through identical page layouts and component trees. A clothing store and an electronics store get the same PDP, PLP, home page, and footer — just different paint. Real-world storefronts differ fundamentally by niche: a fashion boutique uses editorial heroes, lookbook grids, and prominent color swatches, while an electronics store emphasizes spec tables, comparison CTAs, and deal banners. Providing genuinely different page structures per business category is a competitive differentiator against Shopify/Zatiq themes and directly improves the end-customer shopping experience by matching layout to product type.

## What Changes

- **New template module system**: Replace the single-layout storefront with a registry of template modules. Each template is a folder of React server components (Home, PLP, PDP, Navbar, Footer) that share a typed data contract but implement completely different page structures, content hierarchies, and visual treatments.
- **Template data contract**: Introduce a shared `TemplateModule` TypeScript interface and page-level prop interfaces (`HomePageProps`, `PLPProps`, `PDPProps`, etc.) that all templates must implement. This guarantees merchants can switch templates freely without data migration.
- **Template registry and resolution**: A `templates/registry.ts` module maps template slugs to their component modules. Storefront page files become thin resolvers (~15 lines) that fetch data and delegate rendering to the resolved template.
- **Three-layer component architecture**: Template-specific pages (Layer 3) compose shared building blocks like `<ProductGrid>`, `<VariantPicker>`, `<ReviewSection>` (Layer 2), which in turn use design-system primitives (Layer 1). New features are added to shared blocks and automatically appear in all templates.
- **`store_templates` DB table**: Stores template metadata (slug, name, description, preview image, business type mappings, allowed subscription tiers, active/draft status). Managed by superadmin.
- **`merchants.template` column**: Replaces the existing `merchants.theme` column. Stores the merchant's active template slug.
- **Business-type auto-assignment**: During onboarding, the merchant's selected business type is mapped to the best-fit template via `store_templates.business_types` JSONB lookup. Fallback: the template marked `is_default`.
- **Template preview**: Merchants can preview any available template using their real store data via a `?template_preview=<slug>` query parameter (owner-only, read-only).
- **Template management UI**: Merchant dashboard settings page with a visual template gallery showing available templates, locked premium templates with upgrade prompts, and a preview/apply flow.
- **SuperAdmin template management**: Admin page to toggle template active/draft status and assign which subscription tiers can access each template.
- **Per-template DESIGN.md files**: Each template has its own design system specification at `designmd/DESIGN-<template_name>.md`, defining its unique color palette, typography, spacing, component tokens, and visual rules. Agents reference the matching DESIGN file when implementing a specific template.
- **Cart and Checkout remain shared**: These functional/trust-critical pages use a single implementation across all templates with light token-driven visual theming only.
- **MVP scope**: Ship with two templates — `general` (evolved from the current storefront) and `fashion` (new editorial/lookbook layout).

## Capabilities

### New Capabilities
- `storefront-template-registry`: Template module system — registry, data contract interfaces, template resolution, and thin resolver page pattern. The core architectural plumbing.
- `storefront-template-general`: The "General Store" template module — a versatile layout suitable for any business type. Evolved from the current storefront implementation.
- `storefront-template-fashion`: The "Fashion Boutique" template module — editorial heroes, lookbook-style product grids, prominent color swatches, "Complete the Look" sections.
- `template-management`: SuperAdmin template CRUD, tier-access assignment, active/draft toggling. Merchant-facing template gallery with preview and apply flow in dashboard settings.
- `template-auto-assignment`: Business-type selection during onboarding and automatic template assignment based on `store_templates.business_types` mapping.

### Modified Capabilities
- `storefront-theme-redesign`: Requirements evolve from CSS-only theming to the full template module system. The `merchants.theme` column is replaced by `merchants.template`. Existing `.storefront-theme-*` CSS blocks are absorbed into per-template stylesheets. The theme selection UI in settings is replaced by the template gallery.

## Impact

- **Database**: New `store_templates` table. Migration to rename `merchants.theme` → `merchants.template` and seed initial template rows.
- **Storefront routes**: `app/(storefront)/[subdomain]/page.tsx`, `product/page.tsx`, `products/page.tsx` become thin resolvers. `layout.tsx` resolves the template and wraps with the correct Navbar/Footer.
- **Components**: Current `components/storefront/` components are refactored into shared blocks (`components/storefront/shared/`) and template-specific components (`templates/<name>/components/`).
- **CSS**: `globals.css` storefront theme blocks are extracted into per-template `styles.css` files under `templates/<name>/`.
- **Middleware/proxy**: `proxy.ts` may need to pass template slug alongside merchant ID in headers.
- **Onboarding flow**: Needs a business-type selection step that feeds into template auto-assignment.
- **Dashboard settings**: Theme selection UI replaced by template gallery with preview/apply.
- **SuperAdmin**: New template management page.
- **Design system**: New `designmd/` directory with `DESIGN-general.md` and `DESIGN-fashion.md` providing per-template design tokens and visual rules.
