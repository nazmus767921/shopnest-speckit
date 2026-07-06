## Why

The current Product Details Page (PDP) layout and styling do not align with the premium, high-contrast, mobile-first SHOP.CO design system guidelines. Redesigning it to match the spec will ensure uniform visual excellence, clear hierarchy, and professional spacing across the storefront.

## What Changes

- **Breadcrumbs & Header Grid**: Update the breadcrumb trail and structure a 2-column layout (gallery on the left, info details on the right) with expanded width (`max-w-7xl`).
- **Image Gallery**: Introduce a thumbnail layout stacked to the left of the main image on desktop, and a touch-friendly carousel on mobile.
- **Rating, Price, and Details**: Style star ratings, pricing rows (with original price strikethroughs and discount tags), and the description block using correct Satoshi vs. Archivo font scoping.
- **Variant Selection**: Redesign color swatches (with checkmarks) and size selector pills (with responsive states).
- **Cart Stepper & CTA Action Bar**: Re-align quantity steppers and "Add to Cart" / "Buy Now" actions into unified inline rows.
- **Product Details Tabs**: Implement tabs for "Product Details", "Rating & Reviews", and "FAQs", along with review grids (2 columns on desktop) and "Write a Review" controls.

## Capabilities

### New Capabilities
- `pdp-layout-and-gallery`: Refine the 2-column main details layout, image thumbnails gallery, responsive mobile carousel, and pricing tags.
- `pdp-variant-and-actions`: Redesign color/size options and the quantity stepper inline with the Add to Cart button.
- `pdp-reviews-and-tabs`: Implement tab sections, filters/sorting buttons, a 2-column review grid, and review cards.

### Modified Capabilities

## Impact

- **Affected Files**:
  - [page.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/(storefront)/[subdomain]/product/[slug]/page.tsx)
  - [VariantProductClient.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/(storefront)/[subdomain]/product/[slug]/VariantProductClient.tsx)
  - Related storefront/gallery components.
