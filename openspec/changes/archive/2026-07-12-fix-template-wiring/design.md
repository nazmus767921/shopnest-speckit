## Context

The ShopNest Storefront Builder allows merchants to configure the visual aesthetics of their store, including typography pairs, social links, and section-specific settings. These settings are persisted to the database and exposed as CSS custom properties (variables) via `lib/theme.ts`, which injects them at the root `layout.tsx` of the storefront. However, individual templates (`general`, `fashion`) and React components currently hardcode typography, colors, and layout configurations, completely overriding and ignoring the dynamic variables injected by the builder.

## Goals / Non-Goals

**Goals:**
- Enable end-to-end theme customization by removing hardcoded typography, colors, and static configuration in storefront templates and sections.
- Add "Archivo Black" to the dashboard font selection options, ensuring merchants can explicitly select the old default look.
- Ensure the `FashionFooter` properly renders WhatsApp and TikTok links.
- Correctly parse WhatsApp inputs to support both raw phone numbers and full URLs without destructive regex stripping.
- Apply the `overlayOpacity` setting to the Hero section to ensure text readability over images.

**Non-Goals:**
- No changes to the database schema (`merchants` table settings are already correct).
- No changes to the Dashboard builder UI (the inputs and data flow are working as expected).
- No new section types or new customization options.

## Decisions

**1. Typography Variable Resolution**
- **Decision:** Remove the CSS variable re-assignments for `--font-display` and `--font-sans` inside `templates/general/styles.css` and `templates/fashion/styles.css`. 
- **Rationale:** The global theme provider injects `--font-heading` and `--font-body`. Sections should reference these directly (e.g., using Tailwind's `font-heading` and `font-body` if defined in config, or standard `font-[var(--font-heading)]` arbitrary values) rather than falling back to hardcoded `font-sans` or `font-serif`.

**2. Robust WhatsApp URL Parsing**
- **Decision:** Instead of aggressively stripping non-numeric characters via `replace(/[^0-9]/g, "")` for all inputs, check if the input is already a valid URL (e.g., starts with `http`). If it is a full URL, use it directly. If it is a raw number (or number with formatting like `+1 (555)`), strip non-numeric characters and format as `https://wa.me/{number}`.
- **Rationale:** Merchants often paste full `https://wa.me/` or `https://api.whatsapp.com/send` links. Destructive parsing breaks these valid URLs.

**3. Fashion Template Social Link Parity**
- **Decision:** Add TikTok and WhatsApp SVG anchor blocks to `FashionFooter.tsx`.
- **Rationale:** Bring the Fashion template into parity with the General template, honoring the fields provided in the `SectionEditors.tsx`.

**4. Hero Image Overlay**
- **Decision:** Introduce an absolute positioning `div` over the Hero image in `FullBleedHero.tsx` using `style={{ opacity: overlayOpacity / 100 }}` to darken the background.
- **Rationale:** The builder allows users to configure this value, but the UI component completely ignores it, often resulting in unreadable white text on bright images.

## Risks / Trade-offs

- **[Risk] Visual Layout Shifts:** Existing storefronts using the Fashion or General templates might experience a font change once this fix is deployed, as they will suddenly inherit the font they originally selected in the dashboard rather than the hardcoded defaults (e.g., Archivo Black). 
  - *Mitigation:* This is fundamentally a bug fix. We are honoring the explicit configuration set by the merchant. No data migration is needed. Furthermore, by adding "Archivo Black" to the dashboard font options, merchants who prefer the old hardcoded default can simply select it to restore their site's original typography.
- **[Risk] Caching Impacts:** None expected. The changes are purely structural within React components and CSS files. The Next.js 16.2.9 caching strategy (`use cache`) remains unaffected as no new dynamic data fetching is introduced.
