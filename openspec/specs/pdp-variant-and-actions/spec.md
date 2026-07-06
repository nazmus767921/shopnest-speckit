# pdp-variant-and-actions Specification

## Purpose
TBD - created by archiving change pdp-redesign. Update Purpose after archive.
## Requirements
### Requirement: Color Attribute Swatches
Variant colors SHALL be displayed as circular swatches with an overlay checkmark icon indicating the active selection state. The swatch component SHALL be implemented as a standalone shared leaf (`components/storefront/ui/variant-color-swatch.tsx`) so it can be consumed by both the PDP and the `VariantQuickSelectDialog` without duplication.

#### Scenario: Selection indicator active color
- **WHEN** a user selects a color swatch option (in PDP or in the quick-select dialog)
- **THEN** a checkmark icon is rendered in the center of the active swatch circle.

#### Scenario: Swatch reusable across contexts
- **WHEN** the color swatch component is imported into the `VariantQuickSelectDialog`
- **THEN** it renders identically to the PDP swatch with no additional styling overrides required.

### Requirement: Size Attribute Pill Options
Variant sizes SHALL be rendered as pill-shaped buttons in Satoshi font. Active selection state SHALL use `var(--color-primary)` background and `var(--color-on-primary)` text. Inactive state SHALL use `var(--color-surface-secondary)` background and `var(--color-text-primary)` text. The size pill component SHALL be implemented as a standalone shared leaf (`components/storefront/ui/variant-size-pill.tsx`) consumable by both PDP and `VariantQuickSelectDialog`.

#### Scenario: Selected size option styling
- **WHEN** a user clicks on a size option pill (in PDP or in the quick-select dialog)
- **THEN** the active button adopts `var(--color-primary)` bg and `var(--color-on-primary)` text; unselected sizes maintain `var(--color-surface-secondary)` bg and `var(--color-text-primary)` text.

#### Scenario: Size pill reusable across contexts
- **WHEN** the size pill component is imported into the `VariantQuickSelectDialog`
- **THEN** it renders identically to the PDP size pill with no additional styling overrides required.

### Requirement: Compare-At Old Price Display
The storefront ProductCard, PDP, and Quick Select dialog MUST render an optional compare-at old price (strike-through style) alongside the sell price if the compare-at price is configured and greater than the current sell price.

#### Scenario: Display strike-through discount price
- **WHEN** a product or active variant has a compareAtPrice greater than its sell price
- **THEN** both the current sell price and the strike-through old price are rendered side by side in the UI

### Requirement: Compact Quantity Stepper and Inline Buy Row
The quantity selector SHALL use a `rounded-full` stepper with height `h-9 md:h-10` and horizontal padding `px-2.5 md:px-4` supporting increment and decrement actions. The stepper SHALL be implemented as a standalone shared leaf (`components/storefront/ui/quantity-stepper.tsx`) consumable by both the PDP inline buy row and the `VariantQuickSelectDialog`. Order checkout pricing calculations MUST resolve variant price overrides when variant items are selected.

#### Scenario: Quantity adjustments update cart product payload
- **WHEN** a user adjusts quantity using the stepper (in PDP or in the quick-select dialog) and confirms Add to Cart
- **THEN** the cart context / server action receives the correct quantity count and computes total price correctly.

#### Scenario: Stepper reusable across contexts
- **WHEN** the quantity stepper component is imported into the `VariantQuickSelectDialog`
- **THEN** it renders identically to the PDP stepper with no additional styling overrides required.

#### Scenario: Checkout resolves variant price override
- **WHEN** a checkout order is created with variant items
- **THEN** the order subtotal and transaction amount are calculated using the variant price overrides, preventing payment mismatches

