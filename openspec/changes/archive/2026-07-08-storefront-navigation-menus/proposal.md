## Why

CMS pages are currently orphaned. While merchants can create pages like `/pages/about-us`, there is no dynamic way for customers to navigate to them because storefront templates currently have hardcoded links. We need an industry-standard navigation system to allow merchants to configure core navigation menus (e.g., Header, Footer) that the storefront templates can consume dynamically, allowing them to link to Pages, Categories, Products, or Custom URLs.

## What Changes

- Introduce `menus` and `menu_items` tables to the database to support flexible, potentially nested navigation structures.
- Create dashboard UI to manage Menus (e.g., "Main Menu", "Footer") and their Menu Items.
- Update data fetching on the storefront to fetch menus by slug for the active merchant.
- Modify existing templates (Fashion, General) to render dynamic menus instead of hardcoded links.
- **BREAKING**: Replaces hardcoded template links. We will need to ensure a default set of links (like Shop, Orders) is seeded or gracefully handled if a merchant has no menus configured yet.

## Capabilities

### New Capabilities
- `storefront-navigation`: Creating and managing flexible navigation menus and items (links) for storefronts.

### Modified Capabilities
- (None)

## Impact

- **Database**: New tables `menus`, `menu_items`.
- **Dashboard**: New "Navigation" UI, likely under the Storefront settings section.
- **Storefront**: Server components in `app/(storefront)/[subdomain]/...` will fetch navigation data.
- **Templates**: Components like `FashionNavbar` and `FashionFooter` will consume the dynamic menu data instead of hardcoded arrays.
