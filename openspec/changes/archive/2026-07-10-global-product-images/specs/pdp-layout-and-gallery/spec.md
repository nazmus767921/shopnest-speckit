## MODIFIED Requirements

### Requirement: Multi-Image Gallery Layout
The gallery component SHALL display a vertical stack of product image thumbnails on the left of the main image on desktop viewports, and collapse to a touch-swipe snap-scroll carousel with pagination dots on mobile viewports. The gallery SHALL exclusively display the global pool of product images and MUST NOT change or filter the displayed images based on the currently selected product variant.

#### Scenario: Thumbnail interaction on desktop
- **WHEN** a user clicks on a thumbnail image on desktop
- **THEN** the main viewport active image swaps to display the selected thumbnail product image.

#### Scenario: Mobile gallery swipe carousel
- **WHEN** a user views the product gallery on viewport width < 768px
- **THEN** the images stack horizontally supporting touch snap scroll with pagination dots indicators below the image wrapper.

#### Scenario: Variant selection does not alter gallery
- **WHEN** a user selects a different product variant on the Product Details Page
- **THEN** the main image gallery remains unchanged and continues to display the global pool of product images.
