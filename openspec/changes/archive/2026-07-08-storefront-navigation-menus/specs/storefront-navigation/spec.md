### Requirement: Pre-seeded Standard Menus
The system SHALL automatically seed a "Main Menu" (`main-menu`) and a "Footer Menu" (`footer-menu`) for every merchant with default items. The system SHALL prevent deleting these menus or editing their slugs, but all items inside them can be created, updated, reordered, or deleted by the merchant.

#### Scenario: Lazily seeding default menus
- **WHEN** a merchant visits the navigation settings dashboard
- **THEN** the system ensures the `main-menu` and `footer-menu` records exist in the database with original default links

#### Scenario: Resetting a menu to defaults
- **WHEN** a merchant clicks "Reset to Defaults" on a menu
- **THEN** the system replaces all current links for that menu with its original pre-seeded items

### Requirement: Merchant can add nested items to a menu
The system SHALL allow merchants to add items to a menu. Menu items MUST support different link types: `url` (custom), `page`, `category`, and `product`. The system MUST support at least one level of nesting (parent-child relationship). Menu labels MUST be constrained (e.g., max 30 characters) to prevent layout breakage.

#### Scenario: Adding a page link to a menu
- **WHEN** a merchant adds a menu item of type `page` and selects a page ID
- **THEN** the system saves the item and the storefront resolves it to the correct `/pages/[slug]` route

#### Scenario: Enforcing label length
- **WHEN** a merchant enters a menu label longer than 30 characters
- **THEN** the system rejects the input with a validation error

### Requirement: Storefront templates render dynamic menus safely
The storefront SHALL fetch menus by their slug (e.g., `main-menu` for navbar, `footer-menu` for footer) and render the configured links. The rendering MUST gracefully handle overflowing items, long labels, and mobile viewports.

#### Scenario: Nested menus on Desktop
- **WHEN** a menu item has children and is viewed on a desktop
- **THEN** it renders as a hoverable or clickable Dropdown menu

#### Scenario: Nested menus on Mobile
- **WHEN** a menu item has children and is viewed in the mobile drawer
- **THEN** it renders as an accordion (collapsible list) to conserve vertical space

#### Scenario: Overflowing navigation links (The "More" dropdown)
- **WHEN** a merchant adds too many links to the `main-menu` (e.g., > 5 top-level items)
- **THEN** the storefront header groups the excess links into a dropdown menu labeled "More"

#### Scenario: Missing menu fallback
- **WHEN** a merchant has not configured a `main-menu`
- **THEN** the template SHALL render a sensible default fallback (e.g., a link to "Shop") to prevent a broken experience
