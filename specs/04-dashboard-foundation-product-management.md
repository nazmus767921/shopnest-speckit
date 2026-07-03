# Spec Unit 4: Dashboard Foundation & Product Management

## Goal
Build the authenticated merchant dashboard shell and implement the full product management flow (list, create, edit) including Supabase Storage integration for product images, utilizing TanStack Query for server state and TanStack Form + Zod for robust form handling.

## Design
* **Visuals:** Mobile-first responsive dashboard layout with a collapsible sidebar/bottom nav for navigation. Consistent use of Tailwind UI components (`components/ui`) such as tables/lists for the product catalog, modals or dedicated pages for forms, and badges for stock status.
* **Structural:**
  * `app/(dashboard)/layout.tsx`: Auth guard checking Better Auth session and wrapping routes in the dashboard shell.
  * `app/(dashboard)/products/page.tsx`: Product list view.
  * `app/(dashboard)/products/new/page.tsx`: Product creation view.
  * `app/(dashboard)/products/[id]/edit/page.tsx`: Product editing view.
* **File Storage:** Use the Supabase Storage `product-images` bucket. Follow the strict naming convention: `product-images/{merchant_id}/{product_id}/{uuid}.{ext}`.

## Implementation

### 1. Dashboard Layout & Auth Guard
* Create `app/(dashboard)/layout.tsx`.
* Use `auth.api.getSession()` to validate the session on the server. If there is no session or the role is not `merchant`, redirect to `/login`.
* Implement the dashboard navigation shell (Links to Orders, Products, Settings, Billing).
* Wrap the children in a TanStack Query provider (e.g., via `app/providers.tsx`) to enable client-side data fetching/caching for the dashboard.

### 2. Validation & Database Queries
* Define a Zod schema in `lib/validations/products.ts` for product creation and updating. Fields: `name`, `description`, `price` (min 0), `stock_count` (min 0), `low_stock_threshold` (min 0), and an array of image files/URLs (max 5).
* In `db/queries/products.ts`, implement `getProducts(merchantId)`, `getProductById(merchantId, productId)`, `createProduct(merchantId, data)`, and `updateProduct(merchantId, productId, data)`. Ensure every query strictly enforces the `merchant_id` filter (Invariant 1).
* Add a check for the Starter plan limit (max 50 products) in the product creation logic (Invariant 7).

### 3. Image Upload (Supabase Storage)
* Ensure a client-side Supabase client exists in `lib/supabase/client.ts`.
* Create a robust image upload utility for the client to push images to the `product-images` bucket.
* Handle the image upload flow: Upload images to Supabase Storage first, receive the URLs, and then submit the final form payload (including image URLs) to the Server Action.

### 4. Product Forms (TanStack Form + Zod)
* Build a reusable `ProductForm` component using `@tanstack/react-form` and `@tanstack/zod-form-adapter`.
* The form should handle standard text/number inputs and a custom field for multiple image uploads (drag & drop or file selector).
* Use the previously defined Zod schema for client-side validation before submission.

### 5. Product Management Routes
* **Server Actions (`app/actions/products.ts`):** Create actions for submitting product forms and deleting products. These must re-verify the auth session, enforce the `merchant_id`, and check plan limits.
* **Listing (`(dashboard)/products/page.tsx`):** Fetch products using TanStack Query. Display in a list or grid with the primary image thumbnail, price, and stock count. Use `staleTime: 0` or invalidate queries on mutation to ensure fresh inventory data.
* **Creation (`(dashboard)/products/new/page.tsx`):** Render the `ProductForm` in creation mode.
* **Editing (`(dashboard)/products/[id]/edit/page.tsx`):** Fetch the existing product data, populate the `ProductForm`, and handle delta updates (including adding/removing images).

## Dependencies
* `@tanstack/react-query`
* `@tanstack/react-form`
* `@tanstack/zod-form-adapter`
* `zod`
* `@supabase/supabase-js` (for client-side storage uploads, if not already present)

## Verification Checklist
- [x] Attempting to access `/(dashboard)/products` unauthenticated redirects to `/login`.
- [x] The dashboard layout correctly displays navigation and adapts to mobile screens.
- [x] Merchant can view the product list, showing name, price, stock, and thumbnail.
- [x] Merchant can successfully create a new product with valid details (name, price, stock, threshold) and up to 5 images.
- [x] Product images are successfully uploaded to the `product-images` Supabase bucket using the correct `merchant_id`/`product_id` path structure.
- [x] Creating or editing a product immediately updates the product list via TanStack Query invalidation.
- [x] Merchant can edit an existing product's details and manage its images (add/remove).
- [x] Zod schema correctly blocks form submission for invalid inputs (e.g., negative stock, missing name, >5 images).
- [x] Server Action rejects product creation if the merchant is on the Starter plan and already has 50 products.
