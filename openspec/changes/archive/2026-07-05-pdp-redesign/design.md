## Context

The storefront Product Details Page (PDP) uses Next.js App Router with dynamic rendering. The data-fetching resides in a server component that calls `connection()` and wraps the content in a `<Suspense>` skeleton. The interactive leaf components (variant selection, gallery triggers, tab switching) are handled by client components.

## Goals / Non-Goals

**Goals:**
- Update the layout and spacings on the PDP page using the `max-w-7xl px-4 md:px-8` shell container.
- Re-architect the variant selectors and action layout to be inline, compact, and styled with black pill buttons and rounded-full steppers.
- Implement the review cards layout (2 columns on desktop) and tab routing state.

**Non-Goals:**
- Modification of backend endpoints or DB schema (no schema changes required).
- Redesigning the main dashboard or checkout flows.

## Decisions

### 1. Caching & Prerendering Safety
- **Decision**: Retain server-side `connection()` inside `ProductDetailPageContent` and wrapping inside a root-level `<Suspense fallback={<ProductDetailSkeleton />}>`.
- **Alternative**: Static rendering. Rejected because merchant subdomain routing and product availability dynamic checks require headers/connection checks.

### 2. Typography & UI Design Rules Check
- **Decision**: Strictly align component layout properties with `DESIGN-storefront-default.md`:
  - **Colors**: Product backdrops use `var(--color-surface-product)` (`#F0EEED`), review borders use `var(--color-border-hairline-light)` (`#E5E5E5`), and discount red uses `#FF3333`.
  - **Pill Buttons**: Add to Cart, Buy Now, and Write a Review are styled as `rounded-full` with no custom drop-shadow classes.
  - **Font Families**: Display font is restricted to the product name title. Descriptions, review text, ratings, and buttons utilize geometric sans-serif Satoshi (`var(--font-sans)`).

### 3. Desktop Gallery Thumbnails Position
- **Decision**: Position thumbnail lists vertically to the left of the main image on viewports >= 1024px, and absolute snap-scrolling lists at the bottom of the main image on mobile.

## Risks / Trade-offs

- **[Risk]** Large images causing Layout Shift (CLS) on mobile viewports.
  - *Mitigation*: Specify aspect ratios on the Next.js `Image` components and fallback to CSS skeleton blocks before lazy-loading.
