# Templates Page Revamp — Live Preview, Visit Store, Typography

Revamp the `/dashboard/templates` page with three features: an iframe-based real-time live preview (Option D), a Visit Storefront button, and typography controls. Also decompose the monolithic 515-line `TemplatesPageClient` and add a unified save bar.

## Proposed Changes

### Preview System (Option D: Iframe with Draft API)

The core idea: embed the merchant's actual storefront in an iframe within the dashboard. The dashboard sends draft section/theme edits via `postMessage`. The storefront preview page listens, updates state, and re-renders — giving pixel-accurate, real-time feedback.

```
┌─ Dashboard (/dashboard/templates) ──────────────────────────────────┐
│                                                                     │
│  ┌─ Editor Pane ──┐   ┌─ PreviewPane ──────────────────────────┐   │
│  │                │   │  📱 💻 🖥  [↻ Reload]  [↗ Visit Store] │   │
│  │  Template      │   │  ┌──────────────────────────────────┐   │   │
│  │  Theme         │ ──postMessage──▶  <iframe>              │   │   │
│  │  Sections      │   │  │  {subdomain}.{rootDomain}/preview│   │   │
│  │                │   │  │                                  │   │   │
│  │  [expand Hero] │ ──focus-section──▶ scrolls to hero     │   │   │
│  │                │   │  └──────────────────────────────────┘   │   │
│  └────────────────┘   └─────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ UnsavedChangesBar ─────────────────────────────────────────┐   │
│  │  ⚠ You have unsaved changes      [Discard]    [Save All]   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### postMessage Protocol

```typescript
// Dashboard → Preview iframe
type PreviewMessage =
  | { type: 'preview-update'; sections: StorefrontSection[]; themeSettings: ThemeSettings }
  | { type: 'focus-section'; sectionKey: string }

// Preview iframe → Dashboard (optional, for ready signal)
type PreviewReady = { type: 'preview-ready' }
```

#### Preview Route Architecture

```
app/(storefront)/[subdomain]/preview/
  ├── page.tsx              ← Server wrapper: fetches initial sections/theme from DB
  └── PreviewClient.tsx     ← "use client": postMessage listener, renders sections

components/storefront/sections/
  └── PreviewSectionRenderer.tsx  ← Client-side section renderer
       ├── AnnouncementMarquee     ← reused (pure client)
       ├── FullBleedHero           ← reused (pure client)
       ├── BrandStory              ← reused (pure client)
       ├── FaqSection              ← reused (pure client)
       ├── ProductGridPlaceholder  ← NEW placeholder card
       └── CategoryPlaceholder     ← NEW placeholder card
```

The preview route lives under the existing storefront route group, so it goes through the proxy middleware (gets `x-merchant-id` headers) and inherits storefront CSS from the layout. The layout renders navbar/footer server-side (saved state), and the preview page renders homepage sections client-side (draft state).

When theme CSS vars change, the preview sets them on `document.documentElement` so they cascade to navbar/footer too.

---

#### [NEW] [page.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/(storefront)/[subdomain]/preview/page.tsx)
Server component that fetches initial sections and theme from DB, passes to `PreviewClient`.

#### [NEW] [PreviewClient.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/(storefront)/[subdomain]/preview/PreviewClient.tsx)
`"use client"` component that:
- Receives initial sections/theme as props
- Listens for `postMessage` events (`preview-update`, `focus-section`)
- Updates local sections/theme state on each message
- Applies theme CSS vars on `document.documentElement` for full-page cascade
- Renders `PreviewSectionRenderer` with current state
- On `focus-section`, scrolls to the target section via `scrollIntoView({ behavior: 'smooth' })`
- Sends `preview-ready` message to parent when mounted

#### [NEW] [PreviewSectionRenderer.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/components/storefront/sections/PreviewSectionRenderer.tsx)
Client-side version of [SectionRenderer.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/components/storefront/sections/SectionRenderer.tsx). Same switch/case structure but:
- Wraps each section in a `<div id="preview-section-{sectionKey}">` for scroll targeting
- Replaces async `DynamicProductGrid` with a styled placeholder card: _"Product Grid — Featured Products"_
- Replaces async `CategoryMosaic` with a styled placeholder card: _"Category Showcase — Shop by Category"_
- Reuses `AnnouncementMarquee`, `FullBleedHero`, `BrandStory`, `FaqSection` directly (they're all pure client components)

---

### Dashboard-Side Preview Components

#### [NEW] [PreviewPane.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/(dashboard)/dashboard/templates/components/PreviewPane.tsx)
Replaces `LivePreviewCanvas`. Contains:
- **Toolbar**: viewport toggles (📱 375px, 💻 768px, 🖥 1280px), reload button, "Visit Store" link
- **Iframe**: `<iframe>` pointing to `{protocol}//{subdomain}.{host}/preview`, with `ref` for postMessage
- **postMessage sender**: Debounced function that sends `preview-update` on every sections/theme state change
- **Section focus**: Sends `focus-section` when a section accordion is expanded in the editor

#### [MODIFY] [TemplatesPageClient.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/(dashboard)/dashboard/templates/components/TemplatesPageClient.tsx)
Major decomposition of the 515-line monolith:
- Extract **template picker accordion** logic (stays inline, it's small)
- Extract **theme settings accordion** logic (stays inline)
- Replace `<LivePreviewCanvas>` with `<PreviewPane>`
- Add `onSectionFocus` callback: when `expandedSection` changes, call `previewRef.sendFocusSection(sectionKey)`
- Remove the two separate save buttons from accordion headers
- Accept new prop: `merchantSubdomain: string`
- Pass sections/theme state to `PreviewPane` for postMessage forwarding

#### [MODIFY] [page.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/(dashboard)/dashboard/templates/page.tsx)
- Pass `merchant.subdomain` as a new prop to `TemplatesPageClient`

#### [DELETE] [LivePreviewCanvas.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/(dashboard)/dashboard/templates/components/LivePreviewCanvas.tsx)
Replaced entirely by `PreviewPane`.

---

### Unified Save Bar

#### [NEW] [UnsavedChangesBar.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/(dashboard)/dashboard/templates/components/UnsavedChangesBar.tsx)
Sticky bottom bar that appears when any changes exist (sections OR theme):
- Shows "You have unsaved changes" with amber styling
- **Discard** button: resets sections/theme to baseline
- **Save All** button: saves both sections AND theme in parallel
- Smooth slide-up animation on appear

Replaces the current separate save buttons in the theme and sections accordion headers.

---

### Visit Storefront Button

Added to the `PreviewPane` toolbar. Opens `{protocol}//{subdomain}.{host}` in a new tab.
Also add a secondary link in the page header next to the title.

URL construction: `${window.location.protocol}//${merchantSubdomain}.${window.location.host}`

---

### Typography Controls

#### [NEW] [fonts.ts](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/lib/fonts.ts)
Curated font pair registry. Each pair defines a heading font and body font, loaded at build time via `next/font/google`:

```typescript
const fontPairs = [
  { id: 'classic',    heading: 'Playfair Display', body: 'Inter' },
  { id: 'modern',     heading: 'Outfit',           body: 'Inter' },
  { id: 'bold',       heading: 'Archivo Black',    body: 'DM Sans' },
  { id: 'elegant',    heading: 'Cormorant Garamond', body: 'Lato' },
  { id: 'clean',      heading: 'Poppins',          body: 'Source Sans 3' },
  { id: 'editorial',  heading: 'Libre Baskerville', body: 'Nunito Sans' },
]
```

Each font is loaded via `next/font/google` with `variable` mode, generating CSS custom properties like `--font-playfair-display`. Exports a helper to get the class names for a given heading/body font selection.

#### [MODIFY] [theme.ts](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/lib/theme.ts)
Add typography CSS variable generation to `getThemeVariables`:
```typescript
if (settings.typography?.headingFont) {
  vars['--font-heading'] = getFontFamily(settings.typography.headingFont)
}
if (settings.typography?.bodyFont) {
  vars['--font-body'] = getFontFamily(settings.typography.bodyFont)
}
```

#### [MODIFY] [layout.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/(storefront)/[subdomain]/layout.tsx)
- Import all font CSS variable classes from `lib/fonts.ts`
- Apply them to the root wrapper div so all fonts are available
- Storefront CSS uses `var(--font-heading)` and `var(--font-body)` to pick up the selection

#### [MODIFY] [TemplatesPageClient.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/(dashboard)/dashboard/templates/components/TemplatesPageClient.tsx)
Add typography controls to the **Global Theme Settings** accordion:
- Heading font `<Select>` — dropdown listing curated fonts, each option rendered in its own font
- Body font `<Select>` — same pattern
- Small preview text below each selector showing the font in action

#### Icons Needed
Add to [icons.ts](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/lib/icons.ts):
- `ExternalLinkIcon` — for Visit Store button
- `MonitorIcon`, `SmartphoneIcon`, `TabletIcon` — for viewport toggles
- `RotateCwIcon` — for reload button
- `TypeIcon` — for typography section (if we add a typography sub-heading icon)

---

## Verification Plan

### Manual Verification
1. Open `/dashboard/templates` — preview iframe loads the merchant's storefront
2. Edit hero title text — iframe updates in real-time
3. Change theme primary color — iframe reflects the color on buttons, accents, and navbar
4. Expand "Hero" section — iframe scrolls to and highlights the hero
5. Click viewport toggles — iframe resizes to mobile/tablet/desktop widths
6. Click "Visit Store" — new tab opens with the actual storefront
7. Change heading font — iframe shows the new font immediately
8. Make edits → "Unsaved changes" bar appears → click "Save All" → toast confirms → bar disappears
9. Make edits → click "Discard" → all changes revert
10. Preview placeholder cards show for product grid and category sections

### Edge Cases
- Preview iframe loads correctly in dev (subdomain.localhost)
- Preview works when no sections exist (shows empty state)
- postMessage doesn't error when iframe hasn't loaded yet (queue messages until `preview-ready`)
- Font selector renders each option in its own font face
