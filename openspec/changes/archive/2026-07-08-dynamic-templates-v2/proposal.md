## Why

The current template system relies on hardcoded styling (colors, fonts) and fixed page layouts, limiting merchants' ability to customize their storefronts to match their brand. By introducing global theme settings and dynamic, reorderable sections (even for standard CMS pages), we can offer a flexible, industry-standard customization experience without overcomplicating the editor.

## What Changes

- Introduction of global `themeSettings` (colors, typography, layout) configurable by the merchant and injected as CSS variables.
- Refactoring the Homepage layout to be 100% driven by dynamic `StorefrontSection`s, transforming previously hardcoded features (like "Featured Products" and "New Arrivals") into reorderable sections.
- Addition of simple CMS Standard Pages with rich text content, allowing merchants to create pages like "About Us" or "Shipping Policy".
- **BREAKING**: Existing templates relying on `HomePageProps.featuredProducts` or `HomePageProps.newArrivals` as separate arrays must be updated to extract this data from `StorefrontSection` components instead.

## Capabilities

### New Capabilities
- `global-theme-settings`: Merchants can configure global colors, fonts, and layout options for their storefront.
- `dynamic-sections`: Conversion of hardcoded homepage areas (Featured, New Arrivals) into manually reorderable sections.
- `cms-standard-pages`: Merchants can create and manage basic Rich Text standard pages with slugs.

### Modified Capabilities
- `<existing-name>`: 

## Impact

- **Database**: New `pages` table for CMS standard pages. Updates to `stores` schema for `theme_settings` JSONB. Updates to `storefront_sections` to support product grid types.
- **Frontend Types**: Expansions to `TemplateModule` to require `StandardPage`. Changes to `HomePageProps`.
- **Styling**: Migration from hardcoded Tailwind classes to mapped CSS variables at the Next.js layout level.
