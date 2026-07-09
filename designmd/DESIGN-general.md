---
version: alpha
name: ShopNest-General-Template
description: The General Store template — a versatile, high-contrast storefront design inspired by SHOP.CO. Bold Archivo Black display headings, clean white canvas, stark borders, pill-shaped CTAs, and a no-shadows flat aesthetic. Suitable for any business type: clothing, electronics, beauty, food, or general retail. The design prioritizes clarity, bold typography, and product-first presentation.

colors:
  primary: "#000000"
  on-primary: "#ffffff"
  canvas-light: "#ffffff"
  canvas-cream: "#ffffff"
  ink: "#000000"
  shade-30: "#F2F0F1"
  shade-40: "#666666"
  shade-50: "#999999"
  hairline-light: "#E5E5E5"
  surface-product: "#F0EEED"
  surface-secondary: "#F2F0F1"
  discount-bg: "rgba(255, 51, 51, 0.1)"
  discount-text: "#FF3333"
  rating-star: "#FFC633"
  success-green: "#01AB31"

typography:
  display-huge:
    fontFamily: "Archivo Black, sans-serif"
    fontSize: 48px
    fontWeight: 800
    lineHeight: 1.1
    textTransform: uppercase
  display-lg:
    fontFamily: "Archivo Black, sans-serif"
    fontSize: 40px
    fontWeight: 800
    lineHeight: 1.1
    textTransform: uppercase
  heading-lg:
    fontFamily: "Archivo Black, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
  heading-md:
    fontFamily: "Archivo Black, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
  heading-sm:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.4
  body-lg:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-strong:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.5
  caption:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4

rounded:
  sm: 8px
  md: 16px
  lg: 20px
  xl: 20px
  pill: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

components:
  btn-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    fontWeight: 600
    rounded: "{rounded.pill}"
    padding: 16px 32px
    hover: "background-color: #333333"
  btn-secondary:
    backgroundColor: "{colors.surface-secondary}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    fontWeight: 600
    rounded: "{rounded.pill}"
    padding: 16px 32px
    hover: "background-color: #E2E0E1"
  btn-outline:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline-light}"
    typography: "{typography.body-md}"
    fontWeight: 600
    rounded: "{rounded.pill}"
    padding: 16px 32px
    hover: "border-color: #000000"
  card-product-image:
    backgroundColor: "{colors.surface-product}"
    rounded: "{rounded.md}"
  card-review:
    backgroundColor: transparent
    border: "1px solid {colors.hairline-light}"
    rounded: "{rounded.md}"
    padding: 24px
  card-order-summary:
    backgroundColor: transparent
    border: "1px solid {colors.hairline-light}"
    rounded: "{rounded.lg}"
    padding: 24px
  input-text:
    backgroundColor: "{colors.surface-secondary}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.pill}"
    padding: 16px 24px
    border: none
  tag-discount:
    backgroundColor: "{colors.discount-bg}"
    textColor: "{colors.discount-text}"
    fontSize: 12px
    rounded: "{rounded.pill}"
    padding: 4px 12px
  block-newsletter:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    padding: 32px 40px
---

## Overview

The General template is a bold, product-first storefront design that works for any retail category. It draws visual DNA from SHOP.CO — massive Archivo Black uppercase headlines that command attention, a pure white canvas, and a stark, high-contrast aesthetic with no shadows, no gradients, and no visual clutter.

The personality comes from the typography: Archivo Black at 800 weight in uppercase for display-level headings creates an immediate, punchy presence. The body UI uses Inter for clean readability. Every button is a pill (9999px radius) — filled black for primary actions, filled grey for secondary, outlined for tertiary.

Product imagery sits on `{colors.surface-product}` (#F0EEED) — a warm light grey that makes product photos pop without requiring white-background photography. This is a practical choice: merchants uploading phone photos get a clean, cohesive look without professional shoots.

## Colors

### Brand & Surface
- **Primary** (`{colors.primary}` — `#000000`): Buttons, headings, primary actions.
- **On Primary** (`{colors.on-primary}` — `#ffffff`): Text on primary-color surfaces.
- **Canvas Light** (`{colors.canvas-light}` — `#ffffff`): Page background.
- **Ink** (`{colors.ink}` — `#000000`): All body text.
- **Surface Product** (`{colors.surface-product}` — `#F0EEED`): Product image card backgrounds. Warm grey.
- **Surface Secondary** (`{colors.surface-secondary}` — `#F2F0F1`): Input backgrounds, secondary card fills.

### Accents
- **Discount Background** (`{colors.discount-bg}` — `rgba(255, 51, 51, 0.1)`): Red-tinted discount badge background.
- **Discount Text** (`{colors.discount-text}` — `#FF3333`): Discount badge text and strikethrough prices.
- **Rating Star** (`{colors.rating-star}` — `#FFC633`): Star rating fill color.
- **Success Green** (`{colors.success-green}` — `#01AB31`): Verified badges, success states.

### Shade Ladder
- **Shade-30** (`{colors.shade-30}` — `#F2F0F1`): Section background fills, dividers.
- **Shade-40** (`{colors.shade-40}` — `#666666`): Secondary text, muted body copy.
- **Shade-50** (`{colors.shade-50}` — `#999999`): Tertiary text, placeholder text.
- **Hairline Light** (`{colors.hairline-light}` — `#E5E5E5`): Card borders, section dividers, input borders.

## Typography

### Font Families
- **Display**: Archivo Black (loaded via `next/font/google`, weight 400 — the font only has one weight which IS the black weight). Used for all display headings. Applied via `var(--font-archivo-black)`.
- **Body**: Inter Variable (loaded via `next/font/google`). Used for all body text, buttons, captions, inputs.

### Hierarchy

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `{typography.display-huge}` | 48px | 800 | 1.1 | Hero headline, page title |
| `{typography.display-lg}` | 40px | 800 | 1.1 | Section title |
| `{typography.heading-lg}` | 32px | 700 | 1.2 | Store name in footer |
| `{typography.heading-md}` | 24px | 700 | 1.2 | Card section title |
| `{typography.heading-sm}` | 20px | 700 | 1.4 | Sub-section heading |
| `{typography.body-lg}` | 16px | 400 | 1.5 | Product description |
| `{typography.body-md}` | 14px | 400 | 1.5 | Default body, buttons |
| `{typography.body-strong}` | 14px | 600 | 1.5 | Bold body, prices |
| `{typography.caption}` | 12px | 400 | 1.4 | Footer text, helpers |

### Principles
- **Archivo Black is always uppercase** for display headings — the all-caps treatment is the brand signature.
- **Inter handles everything else** — body, buttons, inputs, captions. No mixing.
- **No letter-spacing tricks** — the bold weight of Archivo Black carries its own presence without extra tracking.

## Layout

### Page Structure
- **Home**: Hero banner (full-width, store image or gradient background) → Featured products (ProductSlider) → New arrivals grid → Newsletter section → FAQ accordion.
- **PLP**: Filter sidebar left (accordion: categories, price, colors, sizes) + Product grid right (3 col desktop, 2 col tablet, 1 col mobile).
- **PDP**: Two columns on desktop — image gallery left (with thumbnail strip), product details right (name, rating, price, variants, quantity, add-to-cart). Stacks vertically on mobile.
- **Cart**: Split columns on desktop (items left, order summary right). Stacked on mobile.

### Grid
- Product grid: 3 columns desktop, 2 columns tablet, 1 column mobile.
- Product cards: Square image container on `{colors.surface-product}`, product name left-aligned below, star rating, price, compact add-to-cart icon button.
- Max content width: `max-w-7xl` (1280px).

### Spacing
- Section vertical padding: `{spacing.section}` (64px).
- Card internal padding: `{spacing.lg}` to `{spacing.xl}` (24–32px).
- Between-card gap: `{spacing.md}` (16px).

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.sm}` | 8px | Smaller inputs |
| `{rounded.md}` | 16px | Product image cards, review cards |
| `{rounded.lg}` | 20px | Order summary, newsletter block |
| `{rounded.xl}` | 20px | Same as lg (general template doesn't use asymmetric radii) |
| `{rounded.pill}` | 9999px | ALL buttons, text inputs, discount tags |

## Components

### Buttons
- **`btn-primary`** — Black pill, white text. The dominant CTA. Hover darkens to #333333.
- **`btn-secondary`** — Grey pill (`{colors.surface-secondary}`), black text. Secondary actions.
- **`btn-outline`** — Transparent pill with `{colors.hairline-light}` border. Tertiary actions. Hover: border turns black.

### Product Cards
- Image container: `{colors.surface-product}` background, `{rounded.md}` corners.
- Product name: left-aligned, `{typography.body-lg}`, black.
- Star rating: inline stars filled with `{colors.rating-star}`.
- Price: `{typography.body-strong}`, black. Compare-at price: strikethrough, `{colors.shade-40}`.
- Discount badge: `tag-discount` pill, positioned on the image.
- Add-to-cart: Compact icon-only button, right of price section.

### Navigation
- Full-width, white background, `{colors.hairline-light}` bottom border.
- Logo/store name left, search bar center (on desktop), cart + hamburger right.
- Sticky top.

### Footer
- White background (matches canvas), `{colors.hairline-light}` top border.
- Newsletter block in `{colors.primary}` (black) with pill input and subscribe button.
- 5-column link grid below: store info + 4 utility columns.
- Copyright + payment badges at bottom.

## Do's and Don'ts

### Do
- Always use Archivo Black in UPPERCASE for display headings.
- Always use pill radius (`{rounded.pill}`) for all buttons and text inputs.
- Use `{colors.surface-product}` for all product image backgrounds.
- Keep the layout clean, grid-based, and product-focused.
- Use `{colors.discount-text}` (#FF3333) for discount prices and badges.

### Don't
- Don't add drop shadows, box shadows, or any shadow effects anywhere.
- Don't use Archivo Black for body text — it's display only.
- Don't use any rounded-rectangle buttons — pill shape is non-negotiable.
- Don't introduce colors outside this palette — no blues, purples, or teals.
- Don't use gradient backgrounds — the general template is flat and stark.
- Don't add decorative illustrations or patterns — photography and products do the visual work.

## Responsive Behavior

| Breakpoint | Width | Key Changes |
|---|---|---|
| Desktop | ≥ 1024px | 3-col product grid, sidebar filters, two-col PDP |
| Tablet | 768–1023px | 2-col product grid, collapsible filters |
| Mobile | < 768px | 1-col product grid, hamburger nav, stacked PDP, full-width hero |
