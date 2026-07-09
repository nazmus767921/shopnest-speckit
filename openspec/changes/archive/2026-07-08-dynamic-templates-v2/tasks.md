## 1. Database & Types

- [x] 1.1 Write failing DB schema tests for `theme_settings` in `stores` and the new `pages` table
- [x] 1.2 Create Drizzle migration to add `theme_settings` JSONB to `stores`
- [x] 1.3 Create Drizzle migration to create `pages` table (id, merchant_id, slug, title, content, is_published)
- [x] 1.4 Update Drizzle schema definitions in code (`db/schema.ts`)
- [x] 1.5 Update `templates/types.ts` to include `ThemeSettings` interface and add it to `StoreData`
- [x] 1.6 Update `templates/types.ts` to require `StandardPage` in `TemplateModule`
- [x] 1.7 Update `lib/storefront-sections/types.ts` to include `ProductGridContent` in `StorefrontSectionContent`

## 2. Global Theme Settings

- [x] 2.1 Write failing component test for layout rendering CSS variables
- [x] 2.2 Update root layout `app/[subdomain]/layout.tsx` to read `theme_settings` and inject CSS variables (`--color-primary`, etc.)
- [x] 2.3 Refactor existing Tailwind classes in `Fashion` template to use the new CSS variables (e.g., replace `bg-blue-600` with `bg-primary`)
- [x] 2.4 Add Theme Settings UI to `TemplatesPageClient.tsx` (Colors and Border Radius)
- [x] 2.5 Ensure all CSS variables mapped in `lib/theme.ts` explicitly override template stylesheet variables for strict alignment

## 3. Dynamic Homepage Sections

- [x] 3.1 Write failing integration test for homepage sections data fetching
- [x] 3.2 Create data fetching utilities for `ProductGridContent` (e.g. `getNewArrivals`, `getFeaturedProducts`, `getExclusiveProducts`) using `"use cache"`
- [x] 3.3 Refactor `HomePageProps` to remove hardcoded product arrays
- [x] 3.4 Update `FashionHomePage.tsx` to iterate over `sections` prop and dynamically render `ProductGrid` components instead of relying on hardcoded props
- [x] 3.5 Verify the homepage loads and sections are correctly ordered based on DB sortOrder
- [x] 3.6 Update `TemplatesPageClient.tsx` with an `+ Add Section` flow using the custom `Select` to add missing sections

## 4. CMS Standard Pages

- [x] 4.1 Write failing test for standard page routing and data fetching
- [x] 4.2 Implement Next.js route handler `app/[subdomain]/pages/[slug]/page.tsx` with proper `"use cache"` boundaries
- [x] 4.3 Create `FashionStandardPage.tsx` component to safely render `dangerouslySetInnerHTML` within the branded layout container
- [x] 4.4 Update `templates/registry.ts` and `Fashion` template module to export the new `FashionStandardPage` component

## 5. Dashboard Pages Management UI

- [x] 5.1 Add Server Actions for Pages (create, update, delete) with revalidatePath and revalidateTag cache invalidations
- [x] 5.2 Add Pages link to dashboard SidebarNavigation
- [x] 5.3 Build app/(dashboard)/dashboard/pages/page.tsx (List Pages)
- [x] 5.4 Build app/(dashboard)/dashboard/pages/new/page.tsx (Create Page)
- [x] 5.5 Build app/(dashboard)/dashboard/pages/[id]/page.tsx (Edit Page)