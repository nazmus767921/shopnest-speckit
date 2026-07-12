## Context

Currently, categories are flat in the database and UI. Merchants need a way to group products under a broader category (e.g., Clothing -> Shirts). We will implement a simple 1-level deep adjacency list system to support subcategories without introducing infinite nesting complexity.

## Goals / Non-Goals

**Goals:**
- Allow categories to act as subcategories by assigning a `parentId`.
- Limit hierarchy to exactly 1 level (Parent -> Child).
- Allow products to belong to any category (parent or child) for maximum flexibility.
- Support Next.js App Router 16.2.9 caching with explicit `use cache` data functions and tag-based revalidation (`revalidateTag("categories")`).

**Non-Goals:**
- Infinite nesting or multi-level category hierarchies (e.g., Parent -> Child -> Grandchild).
- Changing the `products` schema to enforce product placement strictly in leaf categories.

## Decisions

**1. Database Schema Model (Adjacency List)**
- **Decision:** Add a `parentId` column to the `categories` table that self-references `categories.id` (`onDelete: "cascade"`).
- **Alternative Considered:** Materialized path (`path` string). Rejected because we only need 1 level of depth, and a `parentId` is much simpler to query and manage using standard ORM relations without heavy string manipulation.
- **Drizzle Implementation:**
  ```typescript
  parentId: text("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "cascade" })
  ```

**2. Enforcing 1-Level Depth Limit**
- **Decision:** Enforced at the application level (in Server Actions `createCategory` and `updateCategory`). Before assigning a `parentId`, we will check if the parent category itself has a `parentId`. If it does, we throw an error.

**3. Product Placement Constraints & Fetching**
- **Decision:** We will not change `products.categoryId`. A product can point to any valid `category.id`, whether it's a parent or a subcategory.
- **Decision:** When fetching products for a specific category page (e.g. `getProductsByCategory`), the query will recursively fetch products from both the requested category AND any of its subcategories (using a subquery or `OR` condition on `parentId`).
- **Rationale:** Keeps schema pure and provides maximum flexibility. If a merchant creates a "Clothing" parent category, they can place generic items there directly. Customers viewing "Clothing" expect to see everything within "Clothing", including items inside "Shirts" and "Pants".

**4. UI & Caching**
- **Decision:** The Dashboard `CategoryModal` will load the list of available parent categories (categories where `parentId` is null). This data fetch will use `'use cache'` but be tagged or revalidated accurately when new categories are made. 
- **Decision:** Storefront navigation will dynamically group categories where `parentId !== null` underneath their respective parent categories.

## Risks / Trade-offs

- **Risk:** Depth Limit Enforcement Bypass
  - **Trade-off/Mitigation:** The application layer must consistently enforce the 1-level limit. A database trigger is an alternative, but adds DB complexity. Application-level validation in Zod and Server Actions is sufficient.
- **Risk:** Storefront Routing Complexity
  - **Trade-off/Mitigation:** If a category slug changes, we need to ensure the nested route (if any) or navigation links update. The storefront currently uses flat slugs for category pages (e.g. `/[subdomain]/categories/[slug]`). We will retain flat routing for the category pages themselves, meaning we just update the *Navigation Menu* visual hierarchy rather than creating deep nested routes like `/clothing/shirts`.
