# pdp-variant-and-actions Specification

## Purpose
TBD - created by archiving change pdp-redesign. Update Purpose after archive.
## Requirements
### Requirement: Color Attribute Swatches
Variant colors SHALL be displayed as circular swatches with an overlay checkmark icon indicating the active selection state.

#### Scenario: Selection indicator active color
- **WHEN** a user selects a color swatch option
- **THEN** a checkmark icon is rendered in the center of the active swatch circle.

### Requirement: Size Attribute Pill Options
Variant sizes SHALL be rendered as pill-shaped buttons in Satoshi font. Active selection state SHALL use a black background and white text. Inactive state SHALL use a light gray background and black text.

#### Scenario: Selected size option styling
- **WHEN** a user clicks on a size option pill
- **THEN** the active button class changes to black bg and white text, while unselected sizes maintain light gray bg and black text.

### Requirement: Compact Quantity Stepper and Inline Buy Row
The quantity selector SHALL use a rounded-full stepper height `h-9 md:h-10 px-2.5 md:px-4` supporting increment and decrement actions. The stepper and "Add to Cart" / "Buy Now" button SHALL be positioned inline on desktop viewports.

#### Scenario: Quantity adjustments update cart product payload
- **WHEN** a user adjusts quantity using the stepper and clicks Add to Cart
- **THEN** the cart context updates the item quantity count and price correctly.

