## Context

The `/dashboard/templates` page currently uses a 5/12 + 7/12 grid layout. The left pane has 3 accordions (template picker, theme settings, sections editor) and the right pane has a `LivePreviewCanvas` that renders gray wireframe rectangles. The storefront is rendered via a template module system (`templates/registry.ts`) where each template exports `HomePage`, `PLP`, `PDP`, etc. Homepage sections are rendered by `SectionRenderer` which dispatches to components like `FullBleedHero`, `AnnouncementMarquee`, `BrandStory`, `FaqSection` (pure client), and `DynamicProductGrid`, `CategoryMosaic` (async server). Theme settings are injected as CSS variables via `getThemeVariables()` in the storefront layout.

The proxy middleware in `proxy.ts` routes subdomain requests (e.g., `mystore.localhost:3000`) to `/(storefront)/[subdomain]/` routes, setting `x-merchant-id` and `x-merchant-template` headers.

## Goals / Non-Goals

**Goals:**
- Replace the wireframe preview with a pixel-accurate, real-time live preview using the actual storefront rendering
- Add viewport toggles (mobile/tablet/desktop) and section scroll-sync to the preview
- Add a Visit Storefront button that opens the merchant's live store
- Expose typography controls (heading font, body font) using a curated set of Google Fonts
- Unify the separate save buttons into a single sticky save/discard bar
- Decompose the 515-line `TemplatesPageClient` into focused sub-components

**Non-Goals:**
- Changing the storefront rendering pipeline itself (templates, section components)
- Adding new section types (testimonials, newsletter, etc.)
- Image upload integration with Supabase Storage (image fields remain URL inputs)
- Rich text editing for section content
- Full-page template comparison or preview-before-apply flow
- Undo/redo or version history

## Decisions

### Decision 1: Iframe with postMessage for Live Preview

**Choice:** Embed the storefront in an `<iframe>` within the dashboard. A new `/(storefront)/[subdomain]/preview/` route renders a client-side version of the homepage that listens for `postMessage` updates with draft section/theme data.

**Why over alternatives:**
- *vs. Enhanced wireframe (Option B)*: Building miniature representations of every section creates a second rendering system to maintain forever. The iframe reuses actual storefront components — zero rendering duplication.
- *vs. Re-rendering storefront components in-dashboard (Option C)*: Storefront CSS (`100vw` tricks, CSS vars) would bleed into the dashboard. Async server components (`DynamicProductGrid`) can't render in a client component. The iframe provides natural CSS isolation.
- *vs. Simple iframe to actual storefront (Option A)*: Doesn't support real-time updates — changes only show after save + reload.

**postMessage protocol:**
```
Dashboard → Preview:  { type: 'preview-update', sections, themeSettings }
Dashboard → Preview:  { type: 'focus-section', sectionKey }
Preview → Dashboard:  { type: 'preview-ready' }
```

The dashboard debounces `preview-update` messages (300ms) to avoid hammering the iframe on every keystroke.

### Decision 2: Preview Route Under Storefront Layout

**Choice:** Place the preview at `app/(storefront)/[subdomain]/preview/page.tsx` so it goes through the existing proxy middleware and storefront layout.

**Rationale:** The preview inherits storefront CSS, navbar, and footer from the layout — no CSS duplication. The proxy sets `x-merchant-id` headers so the preview route can fetch initial data. Theme CSS var overrides are applied on `document.documentElement` via the client component, cascading to all elements including the layout-rendered navbar/footer.

**Trade-off:** Footer section content changes won't preview in real-time (footer is rendered by the server layout). Acceptable for v1 — footer updates show after save.

### Decision 3: Placeholder Cards for Async Sections

**Choice:** `DynamicProductGrid` and `CategoryMosaic` are async server components that fetch from DB. In the preview client, render styled placeholder cards instead: _"Product Grid — Featured Products"_, _"Category Showcase — Shop by Category"_.

**Why:** Converting these to client components would require client-side data fetching infrastructure (React Query, etc.) for a preview feature. The content merchants edit for these sections is just the title and grid type — the actual products/categories are populated from inventory data, not from the section editor. Placeholders accurately convey what the section IS without needing real data.

### Decision 4: Build-time Font Preloading with CSS Class Switching

**Choice:** Preload all curated fonts at build time via `next/font/google` with `variable` mode. Each font generates a CSS class and custom property (e.g., `--font-playfair-display`). At runtime, the storefront layout applies the correct font class based on the merchant's `themeSettings.typography` selection.

**Why over dynamic `<link>` tags:** `next/font/google` self-hosts fonts and eliminates layout shift. Dynamic `<link>` tags would cause FOUT (Flash of Unstyled Text) on every storefront visit. With ~6 pairs (~11 unique fonts), the build-time cost is negligible — the browser only downloads the 2 active fonts.

### Decision 5: Unified Save Bar

**Choice:** A single sticky bottom bar replaces the two separate save buttons (theme accordion, sections accordion). Appears when `hasUnsavedSections || hasUnsavedTheme`. "Save All" triggers both `updateThemeSettingsAction` and `saveStorefrontSectionsAction` in parallel via `Promise.all`. "Discard" resets both to baseline.

**Rationale:** Separate save buttons confuse merchants — they might save sections but forget theme, or vice versa. A unified bar with a discard option is the standard SaaS pattern (Shopify, Webflow, etc.).

### Decision 6: Caching Strategy for Preview Route

The preview route at `/(storefront)/[subdomain]/preview/page.tsx` is a dynamic route (it needs `headers()` for `x-merchant-id`). The server wrapper calls `await connection()` and is wrapped in `<Suspense>`. The client component is fully interactive with no caching concerns. No `"use cache"` is needed — this is a dashboard tool, not a customer-facing page.

## Risks / Trade-offs

- **Cross-origin iframe communication**: Dashboard (`localhost:3000`) and storefront (`mystore.localhost:3000`) are different origins. `postMessage` handles this natively, but we must validate `event.origin` in the preview listener to prevent unauthorized message injection. → **Mitigation:** Whitelist the dashboard origin.

- **Iframe load time**: The preview iframe loads the full storefront layout (navbar, main, footer). First load may feel slow. → **Mitigation:** Show a loading skeleton inside the `PreviewPane` while the iframe loads. Listen for `preview-ready` message before showing the iframe.

- **Font bundle size**: Preloading 11 fonts adds ~40KB × 11 = ~440KB to the build. But `next/font/google` only includes used subsets, and the browser only downloads the 2 active fonts per page load. → **Mitigation:** Restrict to `latin` subset. Actual runtime download is ~80KB (2 fonts).

- **TemplatesPageClient decomposition risk**: Refactoring a 515-line component into sub-components risks introducing bugs in the working accordion/DnD/save logic. → **Mitigation:** Minimal decomposition — extract `PreviewPane` and `UnsavedChangesBar` as new components, keep the accordion logic in the main component.

- **Footer preview limitation**: The storefront layout renders the Footer server-side. Draft footer content changes won't appear in the iframe until saved. → **Mitigation:** Acceptable for v1. Document this limitation.
