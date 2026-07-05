# pdp-layout-and-gallery Specification

## Purpose
TBD - created by archiving change pdp-redesign. Update Purpose after archive.
## Requirements
### Requirement: Global Container Width and Breadcrumbs
The Product Details Page SHALL use the global app shell container width `max-w-7xl mx-auto px-4 md:px-8` and render a breadcrumb trail showing Home, Shop, Category, and Product Name.

#### Scenario: Breadcrumb navigation and page wrapper on desktop
- **WHEN** a user visits a product details page on a viewport width >= 1024px
- **THEN** the page content wrapper conforms to max-w-7xl, and breadcrumbs render "Home > Shop > [Category] > [Product Name]" in Satoshi font text-shade-40.

### Requirement: Stark High-Contrast Price and Discount Tags
The pricing section SHALL display the current unit price in large bold font-sans, the original price in smaller gray text with a strikethrough, and the discount percentage in a rounded pill-shaped tag using a red wash background and red text.

#### Scenario: Price display for a discounted product
- **WHEN** a product with a 40% discount is rendered
- **THEN** the active price is displayed as large bold, original price is strikethrough, and a red tag reads "-40%" with transparent red background `#FF33331A`.

### Requirement: Multi-Image Gallery Layout
The gallery component SHALL display a vertical stack of product image thumbnails on the left of the main image on desktop viewports, and collapse to a touch-swipe snap-scroll carousel with pagination dots on mobile viewports.

#### Scenario: Thumbnail interaction on desktop
- **WHEN** a user clicks on a thumbnail image on desktop
- **THEN** the main viewport active image swaps to display the selected thumbnail product image.

#### Scenario: Mobile gallery swipe carousel
- **WHEN** a user views the product gallery on viewport width < 768px
- **THEN** the images stack horizontally supporting touch snap scroll with pagination dots indicators below the image wrapper.

