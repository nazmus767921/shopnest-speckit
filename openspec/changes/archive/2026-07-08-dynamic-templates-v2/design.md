## Context

The ShopNest platform currently hardcodes styling and component layouts per template (e.g., the `fashion` template). To empower merchants, we need a way to customize global themes and dynamically reorder sections on the homepage. Additionally, merchants need a way to build standard pages (About, Contact) with a rich-text editor.

## Goals / Non-Goals

**Goals:**
- Enable JSON-based global theme settings (colors, typography).
- Re-architect the Next.js Homepage to be 100% driven by dynamic `StorefrontSection`s instead of hardcoded prop arrays.
- Create a simple CMS architecture for `pages` (slug, HTML content).

**Non-Goals:**
- Creating a visual drag-and-drop page builder tool (like Elementor) is out of scope. We are relying on simple form-based block ordering in the admin.
- Custom dynamic sections on the Product Detail Page (PDP) are out of scope for this version (focusing on Homepage and Standard Pages).

## Decisions

### 1. Global Theme Settings
- **Decision:** Store theme settings in the `stores` table as a `theme_settings` JSONB column. Inject them into the storefront as CSS variables (`--color-primary`) at the root `app/[subdomain]/layout.tsx`.
- **Rationale:** CSS variables integrate perfectly with Tailwind CSS and avoid the need to generate or compile stylesheets on the fly.
- **Alternatives:** Injecting inline styles per component (too repetitive), or writing a Tailwind plugin (requires rebuilds).

### 2. Fully Dynamic Homepage Sections
- **Decision:** Remove `featuredProducts` and `newArrivals` from `HomePageProps`. Add `ProductGridContent` to `StorefrontSectionContent` union type.
- **Rationale:** This unifies all homepage elements into a single `sections` array, allowing merchants to reorder product grids alongside hero banners.
- **Data Fetching Strategy:** Since `StorefrontSection` now dictates what products to show, the server component for the Homepage will iterate over sections and fetch products individually for `ProductGridContent` sections (e.g., top 10 new arrivals), parallelizing with `Promise.all()`. We will utilize Next.js 16 `"use cache"` selectively on these granular fetch functions, passing the `merchantId` and `gridType` as arguments.

### 3. CMS Pages
- **Decision:** Create a `pages` Postgres table. Add a `StandardPage` component to the `TemplateModule` interface.
- **Rationale:** A dedicated table with `(merchant_id, slug)` uniqueness ensures fast lookups. The `StandardPage` component handles the rendering of raw HTML string in a safe, branded container.

## Risks / Trade-offs

- **Risk:** XSS vulnerabilities from rendering raw HTML on standard pages.
- **Mitigation:** The merchant admin must sanitize HTML before saving it to the database, and the storefront should utilize a robust sanitizer (like DOMPurify on the server/client) before setting `dangerouslySetInnerHTML`.
- **Risk:** Uncached sequential fetching for many dynamic sections could hurt TTFB.
- **Mitigation:** Use `Promise.all` for parallel section data fetching, and properly wrap data loaders with `"use cache"`.

## Migration Plan

1. Create Drizzle migration to add `theme_settings` to `stores` and create `pages` table.
2. Update the `TemplateModule` interfaces and `lib/storefront-sections/types.ts`.
3. Refactor the `FashionHomePage.tsx` to handle the unified sections array.
4. Add the standard page dynamic route: `app/[subdomain]/pages/[slug]/page.tsx`.
