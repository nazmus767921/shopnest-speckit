<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->


# Core Principles & Architecture:
    - Library-First: Features start as standalone libraries with defined public APIs before application composition.
    - Functional Programming: Pure functions, immutable data transformations, side-effects isolated at boundaries.
    - Test-Driven Development (TDD): Red-Green-Refactor. Tests must be written and approved before implementation code.
    - Integration Testing: Mandatory for library contracts, inter-service boundaries (Postgres, Resend, Storage, Telegram), and shared Zod schemas.
    - RSC by Default: `"use client"` isolated to interactive leaves.
    - "use cache" Granularity: Apply `"use cache"` only on data-fetching functions/components, never globally at page/layout level. Banned route segment config variables.
    - React Compiler: Automated optimization; manual `useMemo`/`useCallback` strictly forbidden.
    - Prerendering Safety: Wrap dynamic/non-deterministic operations (`cookies()`, `headers()`, etc.) in `<Suspense>` and call `await connection()` from `"next/server"` to prevent static build abort errors.
    
# Eleven Non-Negotiable Invariants:
    1. Merchant-ID Filter: Every query must include merchant_id from `auth.api.getSession()`, never from client.
    2. Stock Non-negative: `products.stock_count` >= 0 via Postgres transactions with `WHERE stock_count >= quantity` guard.
    3. Price Snapshotted: `order_items.unit_price` is written once at checkout.
    4. Auth Secret: `BETTER_AUTH_SECRET` and server auth instances never imported in client code.
    5. Subdomain Immutable: `merchants.subdomain` rejects UPDATE after INSERT.
    6. Email Non-blocking: Email dispatch wrapped in try/catch (best-effort delivery).
    7. Limits Enforced Server-side: Subscription plan limits checked in Server Actions/API routes.
    8. UI Primitives Only: Composed from Shadcn UI components under `components/ui/`.
    9. Shadcn UI First: Adopt Shadcn UI default design system and components. Avoid building custom components unless necessary.
    10. Payment Snapshot Priority: Use `payment.featuresAtPaymentTime` to resolve grand-fathered features/limits; use warnings, not hard-blocks during verification.
    11. Icons from Registry Only: ALL icons MUST be imported from `lib/icons.ts`, never directly from `lucide-react` or any other icon library. If an icon is needed but not yet exported from `lib/icons.ts`, add it there first, then import from the registry. This ensures a single source of truth for icon switching.

# Security & Secrets:
    - Multi-tenant isolation at application query layer (explicit merchantId) and Postgres RLS.
    - Anonymous Supabase client: Storage bucket RLS must grant access `TO public`.
    - Secrets module evaluation: Do not throw on missing env secrets during build phase (`process.env.NEXT_PHASE === "phase-production-build"`).

# Technical Conventions:
    - Zod validation: Use `error.issues[0].message` for safeParse errors. Use `z.url()` and `z.email()`.
    - Next.js Image: Must include `sizes` prop when using `fill`.
    - Zustand: Verify store has finished hydration (`useStore.persist.hasHydrated()`) before redirects.




# MUST FOLLOW
- Do not run build command or `bun run build` , `bun build` or dev server (`bun dev`) command without permission. Ask for permission before running.
-  use `bun` command to run scripts not `npm` or `pnpm`. `npx` is equal to `bunx`.
- All primitives like input, select, textarea, button, sheet, dialog, confirmation dialog, dropdown, table, menu, toast, tooltip, popover, badge, avatar, card etc must use custom components from `components/ui/`. If not available then ask if you should create one.
- ALL icons MUST be imported from `@/lib/icons`. NEVER import directly from `lucide-react` or any other icon library. If an icon is missing from `lib/icons.ts`, export it there first, then use it. This is non-negotiable.

# Storefront Template Architecture Rules

> These rules govern ALL storefront template work. They encode binding architectural decisions. Do NOT deviate, propose alternatives, or "improve" these constraints without explicit user approval.

## Philosophy
    - Squarespace-Level Opinionation: Templates are pixel-perfect, designer-controlled layouts. Merchants customize CONTENT (text, images), never LAYOUT or STYLE. The merchant is a content editor, not a designer.
    - Premium By Constraint: The premium feel comes from tight design control, not from giving merchants more options. Fewer knobs = more consistency = more premium.

## Section System — 10 Non-Negotiable Rules

### 1. Universal Section Catalog
    - There are exactly 10 section types, system-defined, universal across all templates.
    - Every template MUST render all 10 sections in its own visual style.
    - NEVER add template-specific section types. If a new section is needed, it goes into the universal catalog.

### 2. The 10 Sections (Fixed Catalog)
    | Key | Classification | Description |
    |-----|---------------|-------------|
    | `announcement_bar` | Optional | Top-of-page promotional text strip |
    | `hero` | Core | Primary hero banner with image, headline, CTA |
    | `category_showcase` | Core | Browse-by-category navigation |
    | `featured_products` | Core | Curated product grid |
    | `promo_banner` | Optional | Mid-page sale/discount callout |
    | `brand_story` | Optional | About/brand narrative with image |
    | `testimonials` | Optional | Customer reviews/social proof |
    | `newsletter` | Optional | Email capture form |
    | `faq` | Optional | Frequently asked questions accordion |
    | `footer` | Core | Store info, links, contact, socials |

### 3. Core vs Optional
    - Core (4): `hero`, `category_showcase`, `featured_products`, `footer` — always visible, cannot be hidden by merchant.
    - Optional (6): `announcement_bar`, `promo_banner`, `brand_story`, `testimonials`, `newsletter`, `faq` — merchant can toggle on/off.
    - NEVER make a core section optional or vice versa without explicit user approval.

### 4. Fixed Section Order — No Reordering
    - Section order is fixed per template. The template defines the display order.
    - Merchants CANNOT reorder sections. No drag-and-drop. No sortOrder editing.
    - NEVER implement section reordering UI or make sortOrder merchant-editable.

### 5. Content Customization — Text + Images ONLY
    - Merchants can edit: headlines, descriptions, button labels, button links, images.
    - Merchants CANNOT edit: column counts, grid layouts, section colors, fonts, backgrounds, animation settings, or any visual/layout property.
    - Data source selections (e.g., `gridType` for featured products) are CONTENT, not design. Merchants keep these.
    - NEVER add layout knobs, style overrides, or design choice dropdowns to section editors.

### 6. Vertical Stack Layout + Color Rhythm
    - Sections stack vertically. Hidden optional sections collapse out (no gap/space remains).
    - Each template defines a section color rhythm (alternating background themes). When sections are hidden, the color rhythm re-calculates to prevent visual clashes (e.g., two dark sections adjacent).
    - NEVER implement cross-section visual transitions, overlapping sections, or sections that are "aware" of their neighbors' content.

### 7. Hybrid Component Architecture
    - Shared primitives live in `components/storefront/primitives/` (ProductCard, CategoryCard, TestimonialCard, NewsletterForm, PriceDisplay, StarRating, etc.)
    - Per-template sections live in `templates/<slug>/sections/` (HeroSection, CategoryShowcase, FeaturedProducts, PromoBanner, Footer, etc.)
    - Rule: If a section's DOM structure/layout fundamentally changes between templates → per-template component. If it's the same structure just restyled → shared component with template-scoped CSS.
    - NEVER put template-specific section components in shared directories. NEVER duplicate shared primitives into template directories.

### 8. Template Infrastructure
    - Multi-template architecture stays (registry, resolver, template picker, DB table, CSS scoping).
    - Currently ONE template exists (renamed from "fashion" to a neutral/premium name).
    - `general` and `retail` templates are DELETED. Do not reference or recreate them.
    - New templates follow the same hybrid pattern: ~5 unique section components + shared primitives.

### 9. Dashboard Section Editor
    - The templates dashboard shows a vertical list of all 10 sections in fixed order.
    - Core sections display a lock icon (not toggleable).
    - Optional sections display an on/off toggle switch.
    - Clicking a section expands an inline content editor (accordion pattern).
    - Live preview iframe remains. Theme customization (colors, fonts, border radius) remains.
    - NEVER re-introduce drag-and-drop, section reordering, or free-form section addition.

### 10. TemplateModule Contract
    - The `TemplateModule` interface includes both page components (HomePage, PLP, PDP, CartPage, Navbar, Footer, StandardPage) AND section component declarations.
    - Each template registers its section renderers. The SectionRenderer delegates to the active template's section components (not a generic shared mapper).
    - Shared sections fall back to default implementations when a template doesn't override them.