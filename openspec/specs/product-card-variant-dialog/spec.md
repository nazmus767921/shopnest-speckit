# product-card-variant-dialog Specification

## Purpose
TBD - created by archiving change product-card-enhancement.

## Requirements

### Requirement: Dialog Trigger on Product Card Add to Cart
The `ProductCard` component SHALL replace its direct cart-dispatch action with a dialog trigger. Tapping / clicking the "Add to Cart" button on a product card SHALL open the `VariantQuickSelectDialog` without navigating away from the current page.

#### Scenario: Dialog opens on button tap
- **WHEN** a user taps or clicks the "Add to Cart" button on a product card
- **THEN** the `VariantQuickSelectDialog` opens with that product's data (name, image, variants) pre-loaded and quantity reset to 1

#### Scenario: Direct cart dispatch is blocked
- **WHEN** a user taps "Add to Cart" on a product card
- **THEN** no cart item is created until the user completes variant selection and confirms in the dialog

### Requirement: Variant Selection Inside Dialog
The dialog SHALL display all variant dimensions for the product (color swatches and/or size pills) using the same visual tokens and interaction model defined in `pdp-variant-and-actions`. At least one variant value from each dimension SHALL be selected before the dialog's "Add to Cart" CTA is enabled.

#### Scenario: Color swatch rendering in dialog
- **WHEN** the dialog opens for a product with color variants
- **THEN** color swatches are rendered as circular elements with the variant color, matching the PDP swatch style (active swatch shows checkmark overlay)

#### Scenario: Size pill rendering in dialog
- **WHEN** the dialog opens for a product with size variants
- **THEN** size options are rendered as pill-shaped buttons; inactive pills use `--color-surface-secondary` background with `--color-text-primary` text; active pill inverts to `--color-primary` background with `--color-on-primary` text

#### Scenario: CTA disabled until variant fully selected
- **WHEN** a user opens the dialog and has not selected all required variant dimensions
- **THEN** the "Add to Cart" button inside the dialog is visually disabled and non-interactive

#### Scenario: CTA enabled after full selection
- **WHEN** a user has selected one value from every required variant dimension
- **THEN** the "Add to Cart" button inside the dialog becomes active and interactive

### Requirement: Quantity Stepper Inside Dialog
The dialog SHALL include a compact quantity stepper matching the PDP stepper token spec (`h-9 md:h-10`, `rounded-full`, increment/decrement buttons, numeric display). The minimum quantity SHALL be 1. Quantity SHALL reset to 1 each time the dialog is opened.

#### Scenario: Increment quantity
- **WHEN** a user clicks the "+" button in the dialog stepper
- **THEN** the displayed quantity increments by 1

#### Scenario: Decrement quantity at minimum
- **WHEN** the displayed quantity is 1 and the user clicks the "−" button
- **THEN** the quantity remains 1 and the "−" button is visually disabled

#### Scenario: Quantity resets on re-open
- **WHEN** the user closes and re-opens the dialog (for the same or a different product)
- **THEN** the quantity is reset to 1

### Requirement: Confirmed Add to Cart Dispatches Correct Payload
When the user taps the dialog's "Add to Cart" CTA, the system SHALL dispatch the cart action with `{ variantId, quantity }` where `variantId` is the resolved variant matching all selected dimension values.

#### Scenario: Successful cart dispatch
- **WHEN** a user selects all variants, adjusts quantity, and clicks "Add to Cart" inside the dialog
- **THEN** the existing `addToCart` server action is called with the correct `variantId` and `quantity`; the dialog closes; a success feedback (toast or inline) is shown

#### Scenario: Optimistic feedback
- **WHEN** the cart action is in-flight after clicking "Add to Cart"
- **THEN** the CTA button shows a loading state and is non-interactive to prevent double-submission

### Requirement: Responsive Layout — Bottom-Sheet Mobile / Centered Modal Desktop
The dialog SHALL render as a bottom-sheet on viewports ≤ 640px wide and as a centered modal on wider viewports. Both layouts SHALL use design system tokens exclusively (no hard-coded colors or radii).

#### Scenario: Mobile bottom-sheet presentation
- **WHEN** the dialog opens on a viewport ≤ 640px
- **THEN** the dialog panel slides up from the bottom of the screen with top corners rounded (`--dialog-radius-mobile`) and fills the full viewport width

#### Scenario: Desktop centered modal presentation
- **WHEN** the dialog opens on a viewport > 640px
- **THEN** the dialog panel appears centered in the viewport with `--dialog-radius` applied to all corners and a maximum width of 480px

#### Scenario: Overlay backdrop present
- **WHEN** the dialog is open
- **THEN** a semi-transparent overlay (`--dialog-overlay`) covers the page content behind the dialog

#### Scenario: Dismiss on overlay click
- **WHEN** a user clicks the overlay backdrop outside the dialog panel
- **THEN** the dialog closes without dispatching a cart action

#### Scenario: Dismiss on keyboard Escape
- **WHEN** the dialog is open and the user presses the Escape key
- **THEN** the dialog closes without dispatching a cart action

### Requirement: Theme Token Coverage for Dialog
All dialog surface colors, border, radius, overlay, and z-index values SHALL be expressed as CSS custom properties registered in `global.css` under `:root` and every `[data-theme]` override block. Hard-coded color or radius values in the dialog component are forbidden.

#### Scenario: Theme switch re-skins dialog
- **WHEN** the active `data-theme` attribute on `<html>` changes to a different registered theme
- **THEN** the dialog panel background, border, and overlay automatically adopt the new theme values without any React re-render of the dialog component itself

#### Scenario: No hard-coded values in component
- **WHEN** the dialog component file is audited
- **THEN** no hex color, `rgba()` value, or pixel radius literal appears in JSX style props or component-scoped CSS — all values reference `var(--token-name)` properties
