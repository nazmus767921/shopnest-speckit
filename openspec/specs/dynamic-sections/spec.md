# dynamic-sections Specification

## Purpose
TBD - created by archiving change dynamic-templates-v2. Update Purpose after archive.
## Requirements
### Requirement: Reorderable Product Grids
The system SHALL support adding `ProductGridContent` as a valid type for `StorefrontSection`s, allowing merchants to reorder "Featured Products" and "New Arrivals" grids alongside static content like hero banners.

#### Scenario: Merchant reorders New Arrivals section
- **WHEN** a merchant moves the "New Arrivals" product grid below the "About" section in the dashboard
- **THEN** the storefront homepage renders the New Arrivals grid below the About section

### Requirement: Dynamic Homepage Rendering
The Homepage template SHALL render its content solely by iterating over the `StorefrontSection`s array, rather than relying on hardcoded positional props.

#### Scenario: Customer views dynamic homepage
- **WHEN** a customer loads the homepage
- **THEN** they see sections (Hero, Featured Products, Categories) exactly in the sort order defined by the merchant's `storefront_sections` records

