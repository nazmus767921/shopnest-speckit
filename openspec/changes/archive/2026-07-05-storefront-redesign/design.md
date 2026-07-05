## Context

The ShopNest storefront currently renders pages using root design tokens and variables, causing the storefront pages (PDP, PLP, Cart) to deviate from the SHOP.CO design system and PRD requirements. This design document establishes how to scope theme overrides for multiple themes (default high-contrast and cinematic) and implement the theme settings dashboard picker with plan validation.

## Goals / Non-Goals

**Goals:**
- Scope and apply the SHOP.CO Design System (`context/storefront/DESIGN.md`) specifically to the storefront layout and pages using a scoped CSS class `.storefront-theme-default`.
- Add support for a second premium theme `.storefront-theme-cinematic` which leverages the root ShopNest design system (Neue Haas Grotesk display weights, dark canvas, cream-mint transactional canvases, and outline CTAs).
- Implement a `theme` setting column in the `merchants` table and add a selector UI in the seller settings dashboard (`StoreSettingsForm.tsx`).
- Enforce plan-level validation so that premium themes are restricted to the `growth` subscription plan.

**Non-Goals:**
- Implementing payments or new checkout flow systems (out of scope, we only style existing fields).
- Redesigning the seller dashboard screens themselves.

## Decisions

### 1. Multi-Theme Scoping via Scoped CSS Classes
We will scope the theme properties under distinct classes in `app/globals.css`:
- `.storefront-theme-default`: The default SHOP.CO high-contrast mobile-first theme.
- `.storefront-theme-cinematic`: The premium cinematic theme style.
- *Why:* The storefront layout file (`layout.tsx`) can dynamically load these classes depending on the active merchant's setting (`merchant.theme`). Shared components placed inside this container will automatically resolve their colors/radii/fonts to the active theme's definitions.

### 2. Database Schema Update
We will add a new column to the `merchants` table in `db/schema.ts`:
```typescript
theme: text("theme").default("default").notNull() // "default" | "cinematic"
```
We will generate the migration script to deploy this schema update safely.

### 3. Settings Dashboard Theme Selector
We will update `StoreSettingsForm.tsx` to include a theme selection field:
- Render a radio-card or dropdown group containing the available themes.
- If the merchant's resolved plan is `starter`, the premium `"cinematic"` theme option will be disabled. We will render an inline badge prompting them to upgrade to the `growth` plan to unlock the cinematic theme.
- The update action will validate that the theme selection matches the merchant's plan features before saving.

### 4. Next.js 16.2.9 Caching & Prerendering Safety
- We will fetch `headers()` to resolve the subdomain and `merchantId` inside Server Components.
- To prevent static prerendering compilation aborts, we will wrap dynamic actions in `<Suspense>` boundaries and import `connection` from `"next/server"` to call `await connection()` at the boundary.
- Granularity: `"use cache"` will only be applied to specific data queries (e.g. product/merchant fetch queries), not at the layout or page level.

### 5. Font Integration via Google Fonts
- We will load `Archivo_Black` from `next/font/google` in the storefront layout file and define the CSS variable `--font-display: var(--font-archivo-black)`. Satoshi falls back to `Inter` (which is already globally loaded).
- *Why:* Archivo Black is a free Google Fonts alternative that matches the geometric, ultra-bold look of Integral CF.

### 6. Multi-Tenant Query Isolation
- All db query hooks and server components retrieve `merchantId` resolved via subdomain middleware headers (`x-merchant-id`) and feed it into the queries. 
- Multi-tenancy is enforced strictly at the query level by filtering all records by the fetched `merchantId`.

### 7. UI Design Conformance to DESIGN.md
- **No Shadows:** We enforce flat styling with zero drop shadows.
- **Pill Buttons:** All interactive controls (buttons, selectors, inputs) utilize the `rounded-full` (pill) shape.
- **Tailored Colors:** The light gray surface backdrop for product containers `#F0EEED` is mapped to `bg-surface-product`.

## Risks / Trade-offs

- **[Risk] Styling leak to shared components outside storefront** → *Mitigation:* Ensure all overrides are strictly nested within `.storefront-theme-default` and `.storefront-theme-cinematic` CSS selectors.
- **[Risk] Theme downgrade validation bypass** → *Mitigation:* Add server-side verification to the billing or settings save actions. If a merchant's plan is downgraded to `starter`, their storefront theme must be automatically reset to `"default"`.
- **[Risk] Static compilation failure on dynamic subdomains** → *Mitigation:* Call `await connection()` and wrap dynamic parameters and sub-segments in `<Suspense>` inside `layout.tsx`.

## Testing Strategy

- **Unit/Integration Testing:** Write Vitest tests for the settings save action, ensuring that saving a premium theme (`cinematic`) for a starter plan merchant throws a validation error.
- **Visual Regression Validation:** Verify element styles using local dev build. Check that button padding, border-radii, and fonts resolve correctly under the `.storefront-theme` scope.

