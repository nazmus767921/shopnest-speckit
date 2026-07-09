## Context

Currently, storefront templates (Fashion, General) use hardcoded navigation links in their header and footer. Merchants can create CMS pages, but customers have no way to navigate to them without typing the URL. We need to implement a dynamic menu system that stores navigation structures in the database and renders them in the templates.

## Goals / Non-Goals

**Goals:**
- Implement `menus` and `menu_items` tables in Postgres using Drizzle ORM.
- Build a dashboard UI for merchants to configure navigation menus.
- Update storefront templates to fetch and render dynamic menus.
- Ensure efficient caching of menu data on the storefront using Next.js 16 `"use cache"`.

**Non-Goals:**
- Mega-menus with rich content (images/banners inside menus).
- Complex drag-and-drop tree builders (simple list ordering is fine for MVP, but nesting is supported).

## Decisions

### 1. Database Schema
We will create two tables:
- `menus`: `id`, `merchant_id`, `name`, `slug` (e.g., `main-menu`, `footer-menu`).
- `menu_items`: `id`, `menu_id`, `parent_id` (nullable, for nesting), `label` (max 30 chars), `type` (`url`, `page`, `category`, `product`), `reference_id` (string UUID of the page/category/product), `url` (fallback custom URL), `position` (integer for sorting).

*Rationale*: Separating the container (`menus`) from its contents (`menu_items`) is the industry standard. `parent_id` allows for nested dropdown menus. The 30 character limit on `label` prevents layout breakage.

### 2. Storefront Data Fetching & Caching
We will create a cached data access function for storefronts:
```typescript
"use cache"
export async function getStorefrontMenu(merchantId: string, slug: string) {
   // ... fetch menu and items
}
```
*Rationale*: Menus are read on every page load but updated rarely. Using `"use cache"` ensures optimal TTFB. We will invalidate via `revalidateTag` when a merchant saves their menu in the dashboard.

### 3. Dashboard UI
We will build a management interface at `/dashboard/settings/navigation`. Custom menu creation and parent menu deletion are completely disabled. The merchant can toggle between editing "Main Menu" and "Footer Menu". We will add a "Reset to Defaults" button.

### 4. Multi-tenant Data Access & lazy seeding
All database queries MUST include the `merchant_id` to ensure strict tenant isolation. When loading the settings page, the system will lazily seed the `main-menu` and `footer-menu` containers along with their default links if they are not already found in the database.

### 5. UI/UX Rendering Strategy
- **Nesting**: On desktop, nested items will render as a hover/click dropdown. On mobile (drawer), they will render as an accordion list.
- **Overflow Prevention ("More" dropdown)**: The `FashionNavbar` and `GeneralNavbar` will cap top-level visible links at a safe threshold (e.g., 5). Any additional top-level links will be automatically grouped into a "More" dropdown.
- **Label constraints**: CSS `truncate` classes will be applied to prevent overflow if a merchant somehow circumvents the 30-character Zod limit.

## Risks / Trade-offs

- **[Risk] Complex recursive queries for nested menus** → Mitigation: Fetch all items for a given menu in a single flat query and build the tree structure in-memory using TypeScript. Menus are small enough that this is highly efficient.
- **[Risk] Storefront breaks if no menus exist** → Mitigation: Templates MUST implement a fallback navigation structure (e.g., hardcoded links to `/products`) if the database returns no items for `main-menu` or `footer-menu`.
