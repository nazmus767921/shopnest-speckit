## 1. Icon Registry & Shared Utilities

- [x] 1.1 Add `ExternalLinkIcon`, `MonitorIcon`, `SmartphoneIcon`, `TabletIcon`, `RotateCwIcon`, `TypeIcon` exports to `lib/icons.ts`
- [x] 1.2 Create `lib/fonts.ts` — curated font pair registry with `next/font/google` instances (6 pairs, `variable` mode, `latin` subset). Export a `fontPairs` array and a `getFontFamily(fontName)` helper that returns the CSS font-family value.

## 2. Theme Infrastructure

- [x] 2.1 Extend `getThemeVariables()` in `lib/theme.ts` to generate `--font-heading` and `--font-body` CSS variables when `settings.typography.headingFont` / `settings.typography.bodyFont` are set. Verify: call with typography settings → returns font CSS vars; call without → no font vars.
- [x] 2.2 Update `app/(storefront)/[subdomain]/layout.tsx` — import all font CSS variable classes from `lib/fonts.ts` and apply them to the root wrapper `<div>` so font custom properties cascade to all descendant elements.

## 3. Storefront Preview Route

- [x] 3.1 Create `components/storefront/sections/PreviewSectionRenderer.tsx` — client-side section renderer. Reuse `AnnouncementMarquee`, `FullBleedHero`, `BrandStory`, `FaqSection` directly. Render styled placeholder cards for `product_grid_*` and `category_showcase`. Wrap each section in `<div id="preview-section-{sectionKey}">`.
- [x] 3.2 Create `app/(storefront)/[subdomain]/preview/PreviewClient.tsx` — `"use client"` component. Accept `initialSections` and `initialThemeSettings` props. Listen for `postMessage` (`preview-update`, `focus-section`). Validate `event.origin`. Apply theme CSS vars on `document.documentElement`. Render `PreviewSectionRenderer`. Send `preview-ready` on mount. On `focus-section`, scroll target section into view.
- [x] 3.3 Create `app/(storefront)/[subdomain]/preview/page.tsx` — server wrapper. Fetch merchant via `x-merchant-id` header, load sections via `getCachedStorefrontSections`, pass to `PreviewClient`. Use `await connection()` + `<Suspense>`.
- [x] 3.4 Verify preview route works: navigate to `{subdomain}.localhost:3000/preview` → see saved sections rendered with real storefront components inside the storefront layout (navbar + footer).

## 4. Dashboard Preview Pane

- [x] 4.1 Create `app/(dashboard)/dashboard/templates/components/PreviewPane.tsx` — iframe container. Props: `sections`, `themeSettings`, `merchantSubdomain`, `expandedSectionKey`. Toolbar: viewport toggle buttons (mobile 375px / tablet 768px / desktop 1280px, default desktop), reload button, Visit Store external link. Iframe: `src={protocol}//{subdomain}.{host}/preview`. postMessage sender: debounced 300ms `preview-update` on sections/theme change. Send `focus-section` when `expandedSectionKey` changes. Show loading skeleton until `preview-ready` received from iframe.
- [x] 4.2 Delete `app/(dashboard)/dashboard/templates/components/LivePreviewCanvas.tsx`.

## 5. Unified Save Bar

- [x] 5.1 Create `app/(dashboard)/dashboard/templates/components/UnsavedChangesBar.tsx` — sticky bottom bar. Props: `hasUnsavedChanges`, `isSaving`, `onSave`, `onDiscard`. Shows "You have unsaved changes" with amber accent. Discard and Save All buttons. Slide-up animation on appear. Uses Shadcn `Button` component.

## 6. TemplatesPageClient Refactor

- [x] 6.1 Update `app/(dashboard)/dashboard/templates/page.tsx` — pass `merchant.subdomain` as new prop `merchantSubdomain` to `TemplatesPageClient`.
- [x] 6.2 Refactor `TemplatesPageClient.tsx`: Accept `merchantSubdomain` prop. Replace `<LivePreviewCanvas>` with `<PreviewPane>`, passing `sections`, `themeSettings`, `merchantSubdomain`, and `expandedSection` as props. Remove the two separate save buttons from theme and sections accordion headers. Add `<UnsavedChangesBar>` at the bottom with unified save/discard logic (`Promise.all` for both actions).
- [x] 6.3 Add "Visit Store" button in the page header (next to the title). Link: `{protocol}//{merchantSubdomain}.{host}`, `target="_blank"`, using `ExternalLinkIcon`.
- [x] 6.4 Add Typography controls to the Global Theme Settings accordion: heading font `<Select>` and body font `<Select>` using the curated pairs from `lib/fonts.ts`. Each option rendered in its own font face. Updates `themeSettings.typography.headingFont` / `themeSettings.typography.bodyFont`.

## 7. Manual Verification

- [ ] 7.1 Open `/dashboard/templates` → preview iframe loads storefront → edit hero title → preview updates in real-time
- [ ] 7.2 Change theme primary color → preview reflects on buttons/accents/navbar
- [ ] 7.3 Expand "Hero" accordion → preview scrolls to hero section
- [ ] 7.4 Click viewport toggles → iframe resizes (mobile 375px / tablet 768px / desktop full)
- [ ] 7.5 Click "Visit Store" → new tab opens with actual storefront
- [ ] 7.6 Select heading font "Cormorant Garamond" → preview updates heading font in real-time
- [ ] 7.7 Make edits → unsaved bar appears → "Save All" → toast → bar disappears. Make edits → "Discard" → reverts.
- [ ] 7.8 Product grid and category sections show placeholder cards in preview
