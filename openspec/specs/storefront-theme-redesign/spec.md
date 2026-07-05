# storefront-theme-redesign

## Purpose
This capability defines the requirements and behavior for the custom storefront design tokens, typography, layout overrides (for Cart, PDP, PLP, Navbar, and Footer), and plan-enforced theme selection.

## Requirements

### Requirement: Scoped Storefront Styling Override
The system MUST isolate storefront styling and design tokens by scoping them under a `.storefront-theme-default` or `.storefront-theme-cinematic` wrapper class. The system SHALL override the default CSS variables for background, text, borders, colors, and border radii within this wrapper, leaving other parts of the application (e.g. dashboards) unaffected.

#### Scenario: Rendering storefront page
- **WHEN** the user accesses any page under the storefront subdomain route
- **THEN** the page container inherits the active theme class (`.storefront-theme-default` or `.storefront-theme-cinematic`), and styles like backgrounds, text colors, and font families resolve to that theme's design tokens.

### Requirement: Storefront Font Integration
The system MUST load and utilize `Archivo Black` as the display font for all storefront display-level headers and `Inter` for body/UI text under `.storefront-theme-default`, avoiding the Neue Haas Grotesk display fonts used in the root design system.

#### Scenario: Displaying storefront header
- **WHEN** the storefront top navigation and page titles are rendered
- **THEN** the text uses the `Archivo Black` display font and maps to the defined typography headers.

### Requirement: Storefront Product Detail Page Layout
The system MUST render the Product Detail Page (PDP) according to the storefront PRD, including breadcrumbs, image gallery, circular color swatch selectors, active state black-pill size selectors, quantity selector adjustment row, and verified checkmarks on review cards.

#### Scenario: Selecting product size on PDP
- **WHEN** a user selects a size pill on the PDP
- **THEN** the active size pill reverses its colors (black background with white text) and updates the selected variant.

### Requirement: Storefront Product Listing Page Filters and Grid
The PLP MUST display product cards on a light gray background (`#F0EEED`) with rounded corners and no shadows, and allow filtering via accordion filters (Categories, Price, Colors grid, Size grid).

#### Scenario: Filtering products on PLP
- **WHEN** a user selects a color or size filter from the accordion
- **THEN** the products grid updates to show only matching products, rendering cards with the scoped light gray background and rounded corners.

### Requirement: Storefront Cart and Order Summary Layout
The Cart page MUST render a split column layout on desktop and stacked layout on mobile, displaying order items with a quantity adjuster pill and delete icon on the left column, and subtotal/discount breakdown on the right Order Summary card.

#### Scenario: Viewing order summary on Cart page
- **WHEN** the cart page is loaded with items
- **THEN** the Order Summary card calculates subtotal, discounts (in red text), free delivery fee, and shows the Go to Checkout pill button.

### Requirement: Storefront Theme Selection and Subscription Enforcement
The system MUST support multiple themes for the storefront (`default` and `cinematic`). The system MUST allow the merchant to select their theme from the store settings dashboard page. The settings form and the backend update validation SHALL restrict the selection of premium themes (e.g. `cinematic`) to merchants with the `growth` subscription plan.

#### Scenario: Starter plan merchant selects premium theme
- **WHEN** a merchant on the "starter" plan attempts to select the "cinematic" theme on the settings page
- **THEN** the settings page disables the theme selection control, shows an upgrade warning badge, and the backend rejects any update containing "cinematic" as the theme value.

#### Scenario: Growth plan merchant selects premium theme
- **WHEN** a merchant on the "growth" plan selects the "cinematic" theme on the settings page and clicks save
- **THEN** the database is updated with `theme = 'cinematic'` and the storefront pages render using the cinematic design tokens.
