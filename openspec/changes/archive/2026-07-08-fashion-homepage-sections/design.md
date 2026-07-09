## Context

ShopNest currently uses a flat data model for storefront settings (`merchants.heroImageUrl`, `merchants.subtitle`, `merchants.storeDescription`), which severely limits the layout distinctiveness of different templates. To achieve the editorial, magazine-like aesthetic required by the `fashion` template (and future templates), we need a section-based content model that is universal in data structure but rendered uniquely by each template. 

This change introduces a `storefront_sections` database table to hold section data and updates the dashboard to support managing these sections. Furthermore, it implements the fashion template's distinct rendering of these sections.

## Goals / Non-Goals

**Goals:**
- Implement a flexible, universal database schema for storefront sections (`storefront_sections`).
- Pre-seed section defaults (with placeholders) for merchants to prevent broken states.
- Re-architect the Fashion homepage to render these sections using editorial design principles (asymmetric mosaic, 50/50 splits, full-bleed images).
- Consolidate template selection and section content editing into a single "Templates" dashboard page.
- Ensure strict multi-tenant data isolation and proper Next.js caching/revalidation patterns.

**Non-Goals:**
- Dynamic drag-and-drop section reordering (sections have a fixed sort order for now).
- Supporting these sections on the `general` template in this iteration (it will fall back to its existing flat-field rendering).
- Creating entirely bespoke sections that only one template can use (all sections are universal in data shape).

## Decisions

### 1. Database Schema and Multi-Tenant Isolation
- **Decision:** Introduce a `storefront_sections` table linked to `merchants` via `merchant_id`.
- **Details:** 
  - `id` (UUID, PK), `merchant_id` (TEXT, FK), `section_key` (TEXT), `content` (JSONB), `sort_order` (INTEGER), `is_visible` (BOOLEAN).
  - RLS policy will enforce isolation: `(merchant_id = (select auth.uid()))` for dashboard writes, and public read access for storefront queries matching the storefront's `merchant_id`.
  - A unique constraint `(merchant_id, section_key)` prevents duplicate sections.
  - Queries must *always* pass the `merchant_id` derived from `auth.api.getSession()` (dashboard) or hostname resolution (storefront).

### 2. Next.js 16 Caching Strategy for Storefront
- **Decision:** Use Next.js 16 `'use cache'` semantics and Suspense boundaries for section data fetching on the storefront.
- **Details:** 
  - Dynamic route segment `[subdomain]/page.tsx` will `await connection()` or `headers()` to resolve the `merchantId`.
  - The fetch to `storefront_sections` will be isolated in a cached data function (`getStorefrontSections(merchantId)`) with `'use cache'`.
  - This function will be wrapped in a `<Suspense>` boundary in the layout/page to prevent static build abort errors, ensuring the cache is scoped by `merchantId`.
  - Dashboard Server Actions (e.g., `saveSections`) will call `revalidateTag(`sections-${merchantId}`)` after mutating data.

### 3. Server Actions and Zod Validation
- **Decision:** A unified batch-save server action for all sections.
- **Details:** 
  - The dashboard "Save All Sections" action receives an array of updates.
  - It validates the `content` JSONB against specific Zod schemas (`HeroSchema`, `AboutSchema`, etc.) based on `section_key`.
  - The action operates within a transaction to upsert all sections at once.

### 4. UI Design System Adherence
- **Decision:** Follow `DESIGN.md` rules strictly for the dashboard editor and fashion storefront.
- **Details:**
  - Storefront: Pill-only buttons (`rounded-full`), no box shadows (`shadow-none`), tailored canvas colors (`#FAF9F6`), and editorial typography (Playfair Display for headings, Inter for body/eyebrows).
  - Dashboard: Adhere to standard dashboard UI primitives (no raw Tailwind grays/blues, use `components/ui`).

## Risks / Trade-offs

- **Risk:** Type safety of JSONB `content` column across the boundary between DB and React components.
  - *Mitigation:* Define strict TypeScript interfaces (`HeroContent`, `AboutContent`) and map the JSONB payload through Zod parsing at the boundary layer (query returns).
- **Risk:** Overwriting merchant data on fallback/seed.
  - *Mitigation:* The seeding function will check for existing records `ON CONFLICT DO NOTHING` to ensure idempotency. 
- **Risk:** Next.js static prerendering errors due to accessing cookies/headers.
  - *Mitigation:* Strictly `await` dynamic APIs and push dynamic data fetching down the component tree into Suspense-wrapped boundaries.

## Migration Plan

1. Create and run Supabase migration for `storefront_sections`.
2. Deploy the updated dashboard `Templates` page and Server Actions.
3. Deploy the updated `FashionHomePage` and storefront section components.
4. When merchants visit the `Templates` page for the first time, a background/inline call will seed their default sections.

## Testing Strategy

- **Integration Testing:** 
  - Test the server action `saveSections` using a test DB to verify transaction atomicity and Zod validation.
  - Verify that RLS prevents accessing another merchant's sections.
- **Unit Testing:** 
  - Zod schemas must have unit tests covering edge cases (e.g., `overlayOpacity` out of bounds, wrong tile count).

## Open Questions
- None at this time. All requirements are clear.
