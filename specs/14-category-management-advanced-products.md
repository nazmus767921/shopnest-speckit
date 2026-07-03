# Unit 14: Category Management & Advanced Products

## Goal
Implement category management for merchants to organize their products, including enforcing plan-based category limits. Update the product system to support categorization, featuring products, and marking new arrivals for dynamic storefront display.

## Design

### Database Schema Additions & Changes
1. **`categories` Table**:
   - `id`: string (primary key)
   - `merchant_id`: string (foreign key to `merchants.id`, cascade delete)
   - `name`: string
   - `slug`: string (unique per merchant, for URL routing)
   - `created_at`: timestamp
   - `updated_at`: timestamp
2. **`products` Table Updates**:
   - Add `category_id`: string (foreign key to `categories.id`, nullable)
3. **`product_promotions` Table (New)**:
   - `id`: string (primary key)
   - `product_id`: string (foreign key to `products.id`, cascade delete)
   - `merchant_id`: string (foreign key to `merchants.id`, cascade delete)
   - `promotion_type`: text (e.g., 'featured', 'new_arrival', 'exclusive')
   - `created_at`: timestamp

### UI/UX
1. **`(dashboard)/categories` Page**:
   - A list/table view of all categories (Name, Slug, Product Count).
   - "Create Category" button opening a modal.
   - Edit/Delete actions per category.
   - Banner or badge indicating category limit usage (e.g., "3 of 5 categories used").
2. **Category Form**:
   - Fields: Name (Slug auto-generates but can be manually edited).
   - Validations: Enforce max categories limit (5 for Starter, 15 for Growth, unlimited for Pro).
   - The "Create Category" button gets disabled when the merchant reaches their category limit.
3. **`(dashboard)/products` Updates**:
   - **Product Form**:
     - Add a "Category" Combobox to assign a category.
     - Add a multi-badges (can be selected multiple) for Promotions (e.g., Featured, New Arrival, Exclusive).
   - **Product List**:
     - Add Category column.
     - Add badges for active promotion types. The merchant can easily toggle badges directly from the list.

## Implementation

### 1. Database Updates
- Add `categories` table in `db/schema.ts`.
- Add `category_id` to `products` table in `db/schema.ts`.
- Add `product_promotions` table for many-to-many relationship.
- Define relations: A merchant has many categories, a category has many products. A product has many `product_promotions`.
- Generate and run Drizzle migration (`pnpm dlx drizzle-kit generate`, `pnpm dlx drizzle-kit migrate`).

### 2. Category Queries & Limits (`db/queries/categories.ts`)
- `getCategories(merchantId)`
- `getCategoryById(merchantId, categoryId)`
- `createCategory(merchantId, data)`: Must check current category count against merchant's plan limit before inserting. Throw an error if limit exceeded. should be checked in the front-end and the button should be disabled. but still need to check in the back-end.
- `updateCategory(merchantId, categoryId, data)`
- `deleteCategory(merchantId, categoryId)`: Must decide strategy for orphaned products (set `category_id` to null).

### 3. Product Queries Update (`db/queries/products.ts`)
- Update `createProduct` and `updateProduct` to accept `categoryId` and a list of `promotionTypes`. They should manage insertions/deletions in the `product_promotions` table.
- Update `getProducts` to optionally filter by `categoryId` and promotion types. Also join category name and fetch associated promotions.

### 4. Server Actions
- Create `actions/categories.ts` for handling form submissions (Create/Update/Delete). Include proper revalidation of paths (`/dashboard/categories`, `/dashboard/products`).
- Update `actions/products.ts` to handle the new product fields. Add a specific action (e.g., `toggleProductPromotion`) to handle the quick-toggle of badges from the product list without submitting the full form.

### 5. UI Implementation
- **Categories Dashboard**:
  - `app/(dashboard)/categories/page.tsx`: Display list of categories. Fetch plan info to display limit usage.
  - `app/(dashboard)/categories/_components/category-form.tsx`: TanStack Form implementation for category creation/editing. Zod validation for name and slug.
  - `app/(dashboard)/categories/_components/category-list.tsx`: Table layout for categories.
- **Products Dashboard Updates**:
  - Update `app/(dashboard)/products/_components/product-form.tsx`: Add category select (fetching categories via TanStack Query), add a selectable/toggle badges for promotion types.
  - Update product list columns to show category and active promotion badges (togglable on the list).

## Dependencies
- No new external packages required. Existing Drizzle, Zod, and UI components are sufficient.

## Verification Checklist
- [x] Drizzle migration applied successfully, `categories` and `product_promotions` tables created, and `products` table updated.
- [x] Attempting to create a 6th category on a Starter plan fails with a clear UI error.
- [x] Can successfully create, edit, and delete a category.
- [x] Deleting a category sets `category_id` to null for associated products.
- [x] Can assign a category to a new or existing product.
- [x] Can assign multiple promotion types (e.g., featured, new arrival) to a product.
- [x] Products list correctly displays the assigned category and promotion type badges.
- [x] Category names/slugs are correctly validated.
- [x] Row-Level Security (RLS) ensures categories are scoped to the correct `merchant_id`.
