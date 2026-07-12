## Why

Currently, ShopNest only supports a flat, single-level category structure. As merchants grow their product catalogs, they need the ability to organize products hierarchically (e.g., Clothing -> Shirts) to improve storefront navigation and product discovery for their customers.

## What Changes

- Add a `parentId` to the `categories` database schema to support a 1-level deep hierarchy (Adjacency List).
- Update the Dashboard Category Modal to allow selecting a parent category when creating or editing a category.
- Enforce a strict 1-level depth limit at the application level (server actions) so a subcategory cannot have its own subcategories.
- Keep `products.categoryId` unchanged, allowing products to belong to either a parent category or a subcategory directly for maximum merchant flexibility.
- Update Storefront Navigation to render category dropdowns for subcategories.

## Capabilities

### New Capabilities
- `subcategory-system`: Defines the data model and dashboard UI requirements for creating and managing a 1-level deep category hierarchy.

### Modified Capabilities
- `storefront-navigation`: The storefront navigation must be updated to support rendering dropdown menus for categories that have subcategories.

## Impact

- **Database**: `categories` table schema changes.
- **Dashboard UI**: `app/(dashboard)/dashboard/categories/components/CategoryModal.tsx` and related client components.
- **Storefront UI**: The navigation components will need to handle nested category data.
- **Actions**: `createCategory` and `updateCategory` in `app/actions/categories.ts` (and queries in `db/queries/categories.ts`) need to handle `parentId` and enforce depth limits.
