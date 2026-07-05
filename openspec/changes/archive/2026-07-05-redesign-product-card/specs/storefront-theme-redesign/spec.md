## MODIFIED Requirements

### Requirement: Storefront Product Listing Page Filters and Grid
The PLP MUST display product cards with rounded corners and no shadows, and allow filtering via accordion filters (Categories, Price, Colors grid, Size grid). The product card layout MUST left-align the title, star rating, and price. A compact icon-only Add to Cart button MUST be displayed to the right of the price section, and bottom action buttons MUST be removed.

#### Scenario: Filtering products on PLP
- **WHEN** a user selects a color or size filter from the accordion
- **THEN** the products grid updates to show only matching products, rendering cards with the scoped light gray background and rounded corners.

#### Scenario: Adding to cart from Product Card
- **WHEN** a user clicks the compact icon-only Add to Cart button on the product card
- **THEN** the item is added to the cart, the button state updates to indicate success, and the global cart count increases.
