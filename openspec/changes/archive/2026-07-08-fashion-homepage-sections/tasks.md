## 1. Database & Server Setup

- [x] 1.1 Create Supabase migration to add `storefront_sections` table with required columns (id, merchant_id, section_key, content, sort_order, is_visible), unique constraint, and RLS policies (write for matching `merchant_id` via auth, read for matching `merchant_id` via public).
- [x] 1.2 Write Drizzle schema definition for `storefront_sections` in `db/schema.ts` and ensure correct relationships.
- [x] 1.3 Write failing integration tests for database queries (CRUD, unique constraints, RLS).
- [x] 1.4 Implement database queries in `db/queries/storefront-sections.ts` to pass the tests (fetch visible sections, batch upsert).

## 2. Storefront Sections Model (Types & Validation)

- [x] 2.1 Define TypeScript types for section contents (`HeroContent`, `AnnouncementBarContent`, `CategoryShowcaseContent`, `AboutContent`, `StorefrontSection`) in `lib/storefront-sections/types.ts`.
- [x] 2.2 Write failing unit tests for Zod validation schemas for all four section contents.
- [x] 2.3 Implement Zod validation schemas in `lib/validations/storefront-sections.ts` to pass the tests.
- [x] 2.4 Create `lib/storefront-sections/defaults.ts` containing the default content and placeholder image URLs for pre-seeding.

## 3. Server Actions & Dashboard Data Layer

- [x] 3.1 Write failing integration tests for server actions (saving sections, pre-seeding, enforcing merchant isolation).
- [x] 3.2 Implement server actions in `app/actions/storefront-sections.ts`: `saveSections` (batch upsert with transaction) and `seedSections` (idempotent insert). Ensure `merchantId` is strictly read from `auth.api.getSession()`.

## 4. Dashboard Templates Page

- [x] 4.1 Extract the template picker component from `StoreSettingsForm` into a standalone, reusable `TemplatePicker` component.
- [x] 4.2 Create accordion section editor components for the dashboard (`HeroEditor`, `MarqueeEditor`, `MosaicEditor`, `AboutEditor`) ensuring they match the schema.
- [x] 4.3 Create `app/(dashboard)/dashboard/templates/page.tsx` and `TemplatesPageClient.tsx` combining the `TemplatePicker` and the accordion section editors with a unified "Save All Sections" handler.
- [x] 4.4 Remove template picking functionality and fields from `StoreSettingsForm.tsx` (retaining flat fields for general template fallback).
- [x] 4.5 Add the "Templates" navigation link to the dashboard sidebar.

## 5. Fashion Homepage Section Components

- [x] 5.1 Implement `FullBleedHero` component (taking `HeroContent` props).
- [x] 5.2 Implement `AnnouncementMarquee` component (taking `AnnouncementBarContent` props).
- [x] 5.3 Implement `CategoryMosaic` component (taking `CategoryShowcaseContent` and fetching/displaying categories).
- [x] 5.4 Implement `BrandStory` component (taking `AboutContent` props).
- [x] 5.5 Create `SectionRenderer` utility to map section keys to the corresponding components dynamically.

## 6. Storefront Integration

- [x] 6.1 Modify `app/(storefront)/[subdomain]/page.tsx` to fetch `storefront_sections` and pass them down alongside existing data.
- [x] 6.2 Update `app/(storefront)/[subdomain]/templates/fashion/HomePage.tsx` to use `SectionRenderer` to render the homepage layout completely driven by DB state.
- [x] 6.3 Handle fallback/default state: if no sections exist in DB, fallback to `defaultStorefrontSections` in memory so the template never appears broken.
