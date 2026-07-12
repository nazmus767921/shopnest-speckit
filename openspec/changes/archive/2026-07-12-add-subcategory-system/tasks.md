## 1. Database Schema

- [x] 1.1 Add `parentId` to `categories` in `db/schema.ts` referencing `categories.id` (`onDelete: "cascade"`).
- [x] 1.2 Generate drizzle migration using `npm run db:generate`.
- [x] 1.3 Apply drizzle migration using `npm run db:migrate`.

## 2. Queries and Server Actions

- [x] 2.1 Write integration tests in `app/actions/__tests__/categories.test.ts` for enforcing the 1-level depth limit on category creation/updates.
- [x] 2.2 Update `db/queries/categories.ts` to select `parentId` in `getCategories`.
- [x] 2.3 Update `createCategory` in `app/actions/categories.ts` to accept `parentId`. If provided, query the parent category and throw an error if the parent itself has a `parentId`.
- [x] 2.4 Update `updateCategory` in `app/actions/categories.ts` to accept `parentId`. Validate the 1-level depth limit (ensure the new parent has `parentId === null`). Also, validate that a category cannot be assigned to itself, nor can a parent category be assigned to its own child.
- [x] 2.5 Update `getCategories` in `db/queries/categories.ts` to include subcategory products in the `productCount` of parent categories. This requires a query adjustment or subquery (e.g. `or(eq(products.categoryId, categories.id), eq(products.categoryId, subcats.id))`).
- [x] 2.6 Update `getProductsByCategory` in `db/queries/products.ts` to include subcategory products. Modify the where clause to something like `where(or(eq(products.categoryId, categoryId), eq(products.categoryId, subcats.id)))`.

## 3. Dashboard UI (Category Management)

- [x] 3.1 Update `app/(dashboard)/dashboard/categories/components/CategoryModal.tsx` to include a "Parent Category" select dropdown. Populate it with top-level categories only (`parentId === null`).
- [x] 3.2 Ensure the dropdown is disabled if the user is editing an existing subcategory and it has children (preventing making a parent a child).
- [x] 3.3 Update `CategoriesClient.tsx` to display hierarchy (e.g., visually indent subcategories under their parents, or add a column displaying the parent).

## 4. Storefront Navigation Rendering

- [x] 4.1 Locate the storefront navigation rendering component (likely within `app/(storefront)/[subdomain]/components/` or `app/(storefront)/[subdomain]/page.tsx`).
- [x] 4.2 Write a test case for `navigation.tsx` rendering to verify subcategories appear as dropdowns/accordions.
- [x] 4.3 Update the navigation render logic: When rendering a link of type `category`, check if that category has any subcategories. If so, automatically render them as nested children (Dropdown on desktop, Accordion on mobile) alongside any manually configured menu children.
