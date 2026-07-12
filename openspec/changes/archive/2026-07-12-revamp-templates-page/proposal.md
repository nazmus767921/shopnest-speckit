## Why

The `/dashboard/templates` page is the merchant's primary tool for customizing their storefront appearance, yet its preview is a wireframe of gray boxes that shows no real content, colors, or images. Merchants cannot see what their edits will look like without saving and manually navigating to their subdomain. The theme controls are limited to 4 colors and border-radius — typography fields exist in the type system but have no UI. These gaps force merchants to work blind, leading to a frustrating save-check-adjust loop.

## What Changes

- **Iframe-based live preview**: Replace the gray-box wireframe canvas with an iframe that renders the merchant's actual storefront sections using draft (unsaved) data. The dashboard sends edits via `postMessage`, and the preview re-renders in real time. Includes viewport toggles (mobile 375px / tablet 768px / desktop 1280px) and section scroll-sync (expanding a section editor scrolls the preview to that section and highlights it).
- **Visit Storefront button**: Add a prominent button in the page header and preview toolbar that opens the merchant's live storefront (`{subdomain}.{rootDomain}`) in a new tab.
- **Typography controls**: Expose heading font and body font selection in the Global Theme Settings accordion. Use a curated registry of ~6 Google Font pairs preloaded at build time via `next/font/google`. Storefront CSS switches fonts via CSS custom properties (`--font-heading`, `--font-body`).
- **Unified save bar**: Replace the two separate save buttons (theme and sections) with a single sticky bottom bar that appears when any unsaved changes exist, offering "Discard" and "Save All".
- **Component decomposition**: Break the monolithic 515-line `TemplatesPageClient` into focused sub-components for maintainability.

## Capabilities

### New Capabilities
- `storefront-live-preview`: Iframe-based preview system with postMessage communication, viewport toggles, and section scroll-sync for the templates dashboard page.
- `storefront-typography`: Curated Google Font pair registry with build-time preloading, CSS variable integration, and dashboard font selector UI.

### Modified Capabilities
- `templates-dashboard-page`: Adding live preview pane (replacing wireframe canvas), visit storefront button, unified save/discard bar, and component decomposition.
- `global-theme-settings`: Adding typography (heading font, body font) CSS variable generation and extending the `getThemeVariables` function.

## Impact

- **New route**: `/(storefront)/[subdomain]/preview/` — client-side storefront preview that listens for postMessage
- **New components**: `PreviewPane`, `PreviewClient`, `PreviewSectionRenderer`, `UnsavedChangesBar`
- **Modified components**: `TemplatesPageClient` (major refactor), storefront layout (font class application), `theme.ts` (typography vars)
- **Deleted component**: `LivePreviewCanvas` (replaced by `PreviewPane`)
- **New library**: `lib/fonts.ts` — curated font registry with `next/font/google` instances
- **Icon additions**: `ExternalLinkIcon`, `MonitorIcon`, `SmartphoneIcon`, `TabletIcon`, `RotateCwIcon` added to `lib/icons.ts`
- **Dependencies**: No new npm dependencies. `next/font/google` and `postMessage` are built-in.
- **Proxy**: No changes — the preview route goes through existing subdomain routing in `proxy.ts`
