## Why

The business model is changing to restrict image uploads based on plan limits rather than allowing unlimited image uploads per product variant. This change simplifies product image management and enforces storage constraints tied to subscription tiers.

## What Changes

- **BREAKING**: Remove the ability to upload and associate images at the product variant level.
- Add support for a global pool of images per product.
- Enforce the maximum number of product images allowed according to the merchant's subscription plan limit.
- Update the UI to reflect global product images instead of variant-specific ones.
- Update the database schema to remove variant-image associations and ensure images are linked at the product level.

## Capabilities

### New Capabilities
- `global-product-images`: Product-level image management, replacing variant-level image uploads.
- `product-image-limits`: Enforcing maximum image upload limits per product based on the merchant's subscription plan.

### Modified Capabilities
- `pdp-layout-and-gallery`: PDP gallery will need to display global product images instead of variant-specific images when a variant is selected.
- `pdp-variant-and-actions`: The variant selector will no longer dictate which images are shown in the main gallery.

## Impact

- **Database**: The schema for `product_variants` and `product_images` will need updating to migrate existing images and remove variant associations.
- **API/Server Actions**: Actions handling image uploads and product saving will be updated to check plan limits and link images to products, not variants.
- **UI (Dashboard)**: The product creation and editing interface will change. The image upload section will move to the main product details, and the variant section will no longer have image upload capability.
- **UI (Storefront)**: Product Details Page (PDP) image gallery will need to be updated to rely solely on the global product images.
- **Storage**: We need to handle potential overages for existing products or define a migration path for products that exceed the new limits.
