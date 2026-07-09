## 1. Database Schema & Models

- [x] 1.1 Write failing DB tests for menus and menu_items operations
- [x] 1.2 Define Drizzle schema for `menus` and `menu_items` tables in `db/schema/` ensuring `merchant_id` isolation
- [x] 1.3 Create data access layer `db/queries/navigation.ts` for CRUD operations
- [x] 1.4 Generate and apply database migrations

## 2. Server Actions & Validation

- [x] 2.1 Define Zod schemas in `lib/validations/navigation.ts` for menus and items
- [x] 2.2 Write failing tests for navigation Server Actions
- [x] 2.3 Implement `app/actions/navigation.ts` Server Actions (create, update, delete) ensuring auth context

## 3. Dashboard Management UI

- [x] 3.1 Update `app/(dashboard)/components/SidebarLinks.tsx` to include "Navigation" under Settings or Storefront
- [x] 3.2 Create `app/(dashboard)/dashboard/settings/navigation/page.tsx` for listing and managing menus
- [x] 3.3 Create Menu and Menu Item form components using `@tanstack/react-form` and UI primitives
- [x] 3.4 Wire up React Query mutations to invalidate `navigation` query keys on save

## 4. Storefront Integration

- [x] 4.1 Create `getStorefrontMenu` cached data fetching function with Next.js 16 `"use cache"`
- [x] 4.2 Update `FashionNavbar` to render dynamic `main-menu` (implementing a "More" dropdown for > 5 items and nested dropdowns)
- [x] 4.3 Update `FashionNavbar` mobile drawer to use an accordion for nested menu items
- [x] 4.4 Update `FashionFooter` to fetch and render dynamic `footer-menu` (falling back to hardcoded defaults if missing)
- [x] 4.5 Repeat dynamic fetching and responsive UI implementation for `GeneralNavbar` and `GeneralFooter`
