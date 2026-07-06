# cart-layout-overhaul Specification

## Purpose
TBD - created by archiving change cart-page-redesign. Update Purpose after archive.
## Requirements
### Requirement: Stark High-Contrast Redesigned Cart Item Row
The storefront cart page MUST render each cart item inside a responsive flex-layout row container that groups the controls and details strictly to match the SHOP.CO design guidelines. The product image container on the left MUST be large (`h-24 w-24 md:h-32 md:w-32`), have a light gray surface backdrop (`#F0EEED`), and show the product variant parameters (Size and Color) split cleanly on separate lines.

#### Scenario: Displaying cart item with size and color variants
- **WHEN** the cart page renders an item that has size and color variants in `variantLabel` (e.g. "Size: L, Color: White")
- **THEN** the component splits the variants by comma and displays them line-by-line below the title, with the unit price at the bottom-left, the red delete icon at the top-right, and the gray pill-shaped quantity stepper at the bottom-right.

### Requirement: Cart Page Navigation and Breadcrumbs
The storefront cart page MUST show a clean text breadcrumbs layout (`Home > Cart`) above the page header, and the checkout trigger button MUST be styled as a full-width black pill with an arrow icon.

#### Scenario: Clicking on Continue Shopping or breadcrumbs
- **WHEN** the user views the cart page
- **THEN** the breadcrumbs link to the home page, the title is displayed in geometric uppercase display font, and the checkout button is labeled `"Go to Checkout"` with a right arrow icon.

