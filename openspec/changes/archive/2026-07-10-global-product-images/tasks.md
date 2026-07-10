## 1. Database Schema

- [x] 1.1 Remove `variant_images` table from `db/schema.ts` and related relations/indexes.
- [x] 1.2 Generate and apply Drizzle migration to drop the `variant_images` table.

## 2. Server Actions (TDD)

- [x] 2.1 Write failing integration tests for product image uploads to ensure subscription plan limits are enforced.
- [x] 2.2 Update image upload Server Action to fetch active subscription plan limit and reject if exceeded, enforcing global pool.
- [x] 2.3 Write failing tests for product and variant creation to ensure images are no longer linked to variants.
- [x] 2.4 Update product management Server Actions to remove all variant image association logic.
- [x] 2.5 Verify explicit `revalidateTag('product-images')` is called upon successful image upload or deletion.

## 3. UI (Dashboard)

- [x] 3.1 Write failing visual tests or use Storybook to verify that image upload components are removed from variant forms.
- [x] 3.2 Refactor `ProductForm` component to conditionally render global image uploader up to plan limit (replace variant-specific uploaders).
- [x] 3.3 Delete `VariantImageUpload` component and all child components related to variant image association.

## 4. UI (Storefront)

- [x] 4.1 Write failing tests for PDP gallery to ensure it renders global images and ignores variant selection state.
- [x] 4.2 Update the PDP gallery component to display only `product_images` and remove any variant-based image filtering or switching logic.
- [x] 4.3 Ensure that `VariantQuickSelectDialog` and other variant selectors operate independently without affecting the image gallery.
