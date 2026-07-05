## Why

The storefront product card design needs to be aligned with the ShopNest bold, high-contrast, mobile-first design system as specified in the DESIGN-storefront-default.md documentation. The current product card uses text-heavy bottom buttons (Buy Now, Add to Cart) which clutter the layout and deviate from the premium, visual-first aesthetic shown in design references.

## What Changes

- Redesign the product card layout to match the provided high-contrast reference image 1-to-1:
  - Add support for displaying star ratings (e.g., "3.5/5" format alongside rating stars) directly under the title.
  - Left-align all textual content (Product Title, Rating Stars and Text, Pricing and discount tag).
  - Remove the bottom buttons ("Buy Now" and "Add to Cart" text buttons) and the corresponding bottom section.
  - Add a dedicated, compact circular/pill add-to-cart icon-only button to the right of the price section.
- Ensure all design tokens (colors, border radii) are loaded from `--storefront-theme-default` dynamic CSS tokens in `globals.css` so that storefront theme switching functions seamlessly.

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. Replace <name> with kebab-case identifier (e.g., user-auth, data-export, api-rate-limiting). Each creates specs/<name>/spec.md -->

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->
- `storefront-theme-redesign`: Align the product card presentation rules with the new high-contrast theme guidelines.

## Impact

- `components/storefront/ProductCard.tsx`: Major layout and styling updates.
- `app/globals.css`: Define/ensure storefront design tokens are present.
