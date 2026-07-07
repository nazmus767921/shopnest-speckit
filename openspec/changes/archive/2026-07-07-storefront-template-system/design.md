## Context

ShopNest's storefront currently renders every merchant's store through a single set of page components (`app/(storefront)/[subdomain]/`) with CSS-only theming via `.storefront-theme-default` / `.storefront-theme-cinematic` wrapper classes in `globals.css`. The theme system changes colors, fonts, and border radii but preserves identical page structures, component hierarchies, and content flow across all stores. The merchant's selected theme is stored as `merchants.theme` (text column, values `"default"` or `"cinematic"`).

The proposal calls for evolving this into a full template module system where different business niches get genuinely different page structures — different hero layouts, product grid styles, PDP arrangements, and navigation patterns — while sharing the same underlying data model and functional building blocks.

The storefront route tree today:
- `app/(storefront)/[subdomain]/layout.tsx` — reads `merchant.theme`, wraps with themed Navbar + Footer
- `app/(storefront)/[subdomain]/page.tsx` — home page (hero, featured products, FAQs)
- `app/(storefront)/[subdomain]/products/page.tsx` — PLP
- `app/(storefront)/[subdomain]/product/[slug]/page.tsx` — PDP
- `app/(storefront)/[subdomain]/cart/page.tsx` — cart
- `app/(storefront)/[subdomain]/checkout/page.tsx` — checkout
- `app/(storefront)/[subdomain]/orders/` — order tracking

Components live in `components/storefront/` — 20+ files, all shared across themes.

## Goals / Non-Goals

**Goals:**
- Implement a template module architecture where each template is a self-contained folder of React server components with its own page layouts, component tree, and CSS design tokens.
- Define a typed `TemplateModule` data contract so all templates consume identical props and merchants can switch templates freely without data migration.
- Build a three-layer component architecture: template-specific pages → shared functional blocks → design-system primitives.
- Create a `store_templates` DB table for superadmin management of template metadata, tier access, and business-type mappings.
- Ship MVP with two templates: `general` (evolved from current storefront) and `fashion` (new editorial layout).
- Create per-template DESIGN.md files in `designmd/` that define the complete visual identity for each template.
- Support template preview via `?template_preview=<slug>` query parameter for merchant owners.
- Keep Cart, Checkout, and Orders as shared pages with light token-based visual differences only.

**Non-Goals:**
- No visual drag-and-drop editor or merchant-customizable block system — templates are authored by the dev team.
- No dynamic component loading or JSON-driven page builder — templates are static React imports.
- No template marketplace or third-party template authoring.
- No per-section customization within templates (e.g., "hide the testimonials block") — templates are opinionated and complete.
- No migration of historical analytics or merchant content when switching templates — the data model is template-agnostic, so all data is always available.

## Decisions

### Decision 1: Template as Static Import Registry (not Dynamic Loading)

**Choice:** Each template module is a statically imported set of React server components registered in `templates/registry.ts`. Page files import all template modules at build time and select the correct one at runtime.

**Alternatives considered:**
- **Dynamic `import()`**: Would reduce initial bundle size, but with RSC server components don't ship JS to the client anyway. Adds complexity for marginal benefit at 2-5 templates.
- **File-system routing (parallel routes)**: Next.js parallel routes could theoretically render different template layouts, but the subdomain already consumes the dynamic segment. Nested parallel routes for template switching would be fragile and over-engineered.

**Rationale:** With RSC, server component code stays on the server — there's no client bundle cost for importing all templates. Static imports give us type safety, build-time error checking, and dead-simple resolution. This approach scales comfortably to 10+ templates before dynamic loading becomes worth it.

```typescript
// templates/registry.ts
import type { TemplateModule } from './types'
import * as general from './general'
import * as fashion from './fashion'

export const templates: Record<string, TemplateModule> = {
  general,
  fashion,
}

export function getTemplate(slug: string): TemplateModule {
  return templates[slug] ?? templates.general
}
```

### Decision 2: Thin Resolver Page Pattern

**Choice:** Storefront route pages (`page.tsx`) become thin resolvers: they fetch the merchant's template slug from headers, get the template module from the registry, fetch page-specific data, and render `<Template.PageComponent data={data} />`.

```typescript
// app/(storefront)/[subdomain]/page.tsx  (conceptual)
async function StorefrontHome({ params }) {
  await connection()
  const store = await resolveStoreFromHeaders()
  const template = getTemplate(store.template)
  const data = await getHomePageData(store.id)
  return <template.HomePage store={store} data={data} />
}
```

**Rationale:** Keeps the Next.js route tree simple and unchanged. No need for complex routing. Template resolution is a server-side concern — the client never knows about it.

### Decision 3: Shared Data Contract via TypeScript Interfaces

**Choice:** All template modules implement `TemplateModule` — a strict interface defining the component map and prop shapes.

```typescript
// templates/types.ts
export interface TemplateModule {
  HomePage:  React.FC<HomePageProps>
  PLP:       React.FC<PLPProps>
  PDP:       React.FC<PDPProps>
  CartPage:  React.FC<CartPageProps>
  Navbar:    React.FC<NavbarProps>
  Footer:    React.FC<FooterProps>
}

export interface HomePageProps {
  store: StoreData
  featuredProducts: Product[]
  categories: CategoryWithProducts[]
  newArrivals: Product[]
}

export interface PLPProps {
  store: StoreData
  products: Product[]
  categories: Category[]
  activeFilters: FilterState
  pagination: PaginationState
}

export interface PDPProps {
  store: StoreData
  product: ProductDetail
  relatedProducts: Product[]
}

export interface CartPageProps {
  store: StoreData
}

export interface NavbarProps {
  store: StoreData
  subdomain: string
}

export interface FooterProps {
  store: StoreData
}

export interface StoreData {
  id: string
  name: string
  subdomain: string
  template: string
  heroImageUrl: string | null
  subtitle: string | null
  description: string | null
  address: string | null
  socialLinks: Record<string, string> | null
  customFaqs: Array<{ question: string; answer: string }> | null
}
```

**Rationale:** Type-safe contract ensures every template renders correctly with any store's data. The interface is the "agreement" — add a new template, implement the interface, and the system works. Also makes template switching safe: same data, different presentation.

### Decision 4: Three-Layer Component Architecture

**Choice:**

| Layer | Location | Responsibility | Example |
|-------|----------|----------------|---------|
| **L3: Template Pages** | `templates/<name>/` | Layout, section ordering, visual personality | `FashionHomePage.tsx` |
| **L2: Shared Blocks** | `components/storefront/shared/` | Functional building blocks, feature logic | `<ProductGrid>`, `<VariantPicker>` |
| **L1: Primitives** | `components/ui/` | Atomic UI elements, token-driven | `<Button>`, `<Card>` |

- New features (e.g., "Buy Now" button) are added to L2 shared blocks → all templates get them.
- Template-specific components (e.g., `FashionLookbookHero`) live inside `templates/fashion/components/` and are never imported by other templates.
- Templates compose L2 blocks and arrange them in unique layouts.

**Rationale:** Minimizes duplication. Feature work happens at L2 and propagates everywhere. Template work at L3 focuses on layout and visual personality, not reimplementing business logic.

### Decision 5: `merchants.template` Replaces `merchants.theme`

**Choice:** Rename `merchants.theme` column to `merchants.template`. Values change from `"default"` / `"cinematic"` to `"general"` / `"fashion"`. The CSS-only theming system is absorbed into per-template stylesheets.

**Migration:** Existing `"default"` values map to `"general"`. Existing `"cinematic"` values map to `"general"` (cinematic was a CSS-only variant — its visual tokens are rolled into the general template's token system or preserved as a future template).

**Rationale:** The template system subsumes theming. Keeping both would create confusion about which controls the visual identity.

### Decision 6: `store_templates` DB Table for SuperAdmin Management

**Choice:** A new `store_templates` table stores template metadata. The superadmin manages this through the admin dashboard. Template records are seeded during migration.

```sql
CREATE TABLE store_templates (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  business_types JSONB DEFAULT '[]',     -- ["clothing","accessories"]
  allowed_tiers JSONB DEFAULT '["starter","growth","pro"]',
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,      -- exactly one must be true
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

- `business_types`: JSONB array of business type slugs. Used for auto-assignment during onboarding.
- `allowed_tiers`: JSONB array of subscription tier slugs that can access this template.
- `is_default`: Fallback template when no business type match is found. Exactly one template must have this set.
- `is_active`: Superadmin can create templates in draft state before making them available.

### Decision 7: Template Preview via Query Parameter

**Choice:** When a merchant owner navigates their storefront with `?template_preview=fashion`, the layout resolver overrides the template slug. Preview is read-only — it doesn't persist to the DB.

```typescript
// In layout.tsx resolution logic:
const previewTemplate = searchParams.template_preview
const isOwner = await verifyMerchantOwner(merchantId)
const effectiveTemplate = (previewTemplate && isOwner)
  ? previewTemplate
  : merchant.template
```

**Rationale:** Dead simple. No separate preview infrastructure. Uses real data in the real storefront — the merchant sees exactly what their customers would see.

### Decision 8: Cart and Checkout Stay Shared

**Choice:** Cart, Checkout, and Order pages use a single implementation shared across all templates. They receive the same `StoreData` for light token-based visual differences (colors, fonts via CSS custom properties) but do not swap page components per template.

**Rationale:** These are trust-critical functional pages where predictability and reliability matter more than brand personality. The conversion funnel should not be a place for layout experiments.

### Decision 9: Per-Template DESIGN.md Files

**Choice:** Create `designmd/DESIGN-<template_name>.md` files that define the complete visual identity for each template — colors, typography, spacing, border radii, component tokens, and do's/don'ts. Agents reference the matching DESIGN file when implementing a specific template.

- `designmd/DESIGN-general.md` — Evolved from the current `.storefront-theme-default` tokens
- `designmd/DESIGN-fashion.md` — New editorial fashion design system

**Rationale:** Each template needs its own design language documented clearly so that any agent implementing template-specific components has a single source of truth. The root `DESIGN.md` continues to govern the ShopNest platform (marketing pages, dashboard). Template DESIGN files govern storefront rendering.

### Decision 10: Business-Type Auto-Assignment During Onboarding

**Choice:** The onboarding flow includes a "What does your store sell?" step. The selected business type is matched against `store_templates.business_types` JSONB arrays to find the best-fit template. If no match or the matched template isn't in the merchant's tier, fall back to the `is_default` template.

```
Resolution order:
1. Find templates WHERE business_type IN store_templates.business_types
2. Filter by merchant's subscription tier IN allowed_tiers
3. Filter by is_active = true
4. If multiple matches, pick by sort_order
5. If no matches, use is_default = true template
```

## Caching Strategy

All storefront pages use `await connection()` inside `<Suspense>` boundaries to prevent static prerendering, as required by the project's cacheComponents configuration. Template resolution occurs server-side during each request — the merchant's template slug is read from headers (set by middleware/proxy from the DB). No `"use cache"` at page level. Individual data-fetching functions (e.g., `getHomePageData`, `getPublishedProducts`) can apply `"use cache"` at the function level as appropriate.

## DB Schema Modifications

1. **Rename column**: `merchants.theme` → `merchants.template` (with data migration: `"default"` → `"general"`)
2. **New table**: `store_templates` (see Decision 6 schema)
3. **Seed data**: Insert `general` and `fashion` template rows
4. **RLS**: `store_templates` is publicly readable (storefronts need to resolve templates). Write access restricted to superadmin role.
5. **Multi-tenant filter**: Template resolution uses the merchant's own `template` column value — no cross-tenant data access. The `store_templates` table is global (not per-merchant).

## Test Strategy

- **Unit tests**: Template registry functions (`getTemplate`, `resolveTemplateForBusinessType`), data contract type checks.
- **Integration tests**: Template resolution end-to-end — given a merchant with `template = "fashion"`, verify the fashion module's `HomePage` component renders. Business-type auto-assignment logic. Tier-access enforcement.
- **Visual/manual verification**: Each template's pages (Home, PLP, PDP) reviewed against their respective `DESIGN-<name>.md` specifications.

## Risks / Trade-offs

- **Maintenance multiplication** — Every new feature touching storefront pages must be implemented across all templates. → **Mitigation**: Three-layer architecture ensures most features live in L2 shared blocks. Template-specific work is layout arrangement only.
- **Template switching visual mismatch** — A store with content curated for the fashion template (editorial hero images) may look suboptimal in the general template. → **Mitigation**: Preview before switch. Templates designed with graceful fallbacks — they render any data reasonably, even if not perfectly curated.
- **Migration risk for existing merchants** — Renaming `theme` to `template` could break references. → **Mitigation**: Single migration with explicit value mapping. Middleware/proxy updated in the same deployment.
- **Cinematic theme loss** — Merchants currently using `"cinematic"` theme lose their visual treatment. → **Mitigation**: Cinematic design tokens can be rolled into a future premium template. For MVP, map to `"general"` with communication to affected merchants (likely very few).

## Open Questions

- Should the onboarding business-type list be hardcoded or also managed by superadmin via a `business_types` reference table?
- Should template preview render in an iframe within the settings page, or open the full storefront in a new tab?
