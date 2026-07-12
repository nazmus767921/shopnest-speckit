## MODIFIED Requirements

### Requirement: Storefront templates render dynamic menus safely
The storefront SHALL fetch menus by their slug (e.g., `main-menu` for navbar, `footer-menu` for footer) and render the configured links. The rendering MUST gracefully handle overflowing items, long labels, and mobile viewports. Furthermore, if a configured menu item is a `category` that has subcategories, the storefront SHALL automatically render those subcategories as a nested dropdown/accordion under that item, saving merchants from manually duplicating their category hierarchy into the menu builder.

#### Scenario: Nested menus on Desktop
- **WHEN** a menu item has children (either manual menu children OR automatic subcategories from a linked category) and is viewed on a desktop
- **THEN** it renders as a hoverable or clickable Dropdown menu

#### Scenario: Nested menus on Mobile
- **WHEN** a menu item has children (either manual menu children OR automatic subcategories from a linked category) and is viewed in the mobile drawer
- **THEN** it renders as an accordion (collapsible list) to conserve vertical space

#### Scenario: Overflowing navigation links (The "More" dropdown)
- **WHEN** a merchant adds too many links to the `main-menu` (e.g., > 5 top-level items)
- **THEN** the storefront header groups the excess links into a dropdown menu labeled "More"

#### Scenario: Missing menu fallback
- **WHEN** a merchant has not configured a `main-menu`
- **THEN** the template SHALL render a sensible default fallback (e.g., a link to "Shop") to prevent a broken experience

#### Scenario: Automatic Category Hierarchy Rendering
- **WHEN** a merchant links a top-level Category (e.g., "Clothing") in the navigation menu, and that category contains Subcategories (e.g., "Shirts", "Pants")
- **THEN** the storefront automatically renders the Subcategories as a dropdown menu beneath the "Clothing" link without requiring manual menu configuration
