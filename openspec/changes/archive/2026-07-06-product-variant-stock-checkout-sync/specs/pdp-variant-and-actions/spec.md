## ADDED Requirements

### Requirement: Compare-At Old Price Display
The storefront ProductCard, PDP, and Quick Select dialog MUST render an optional compare-at old price (strike-through style) alongside the sell price if the compare-at price is configured and greater than the current sell price.

#### Scenario: Display strike-through discount price
- **WHEN** a product or active variant has a compareAtPrice greater than its sell price
- **THEN** both the current sell price and the strike-through old price are rendered side by side in the UI

## MODIFIED Requirements

### Requirement: Compact Quantity Stepper and Inline Buy Row
The quantity selector SHALL use a rounded-full stepper height `h-9 md:h-10 px-2.5 md:px-4` supporting increment and decrement actions. The stepper and "Add to Cart" / "Buy Now" button SHALL be positioned inline on desktop viewports. Order checkout pricing calculations MUST resolve variant price overrides when variant items are selected.

#### Scenario: Quantity adjustments update cart product payload
- **WHEN** a user adjusts quantity using the stepper and clicks Add to Cart
- **THEN** the cart context updates the item quantity count and price correctly.

#### Scenario: Checkout resolves variant price override
- **WHEN** a checkout order is created with variant items
- **THEN** the order subtotal and transaction amount are calculated using the variant price overrides, preventing payment mismatches

