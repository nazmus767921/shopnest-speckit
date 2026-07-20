---
version: alpha
name: ShopNest-elegance-Template
description: The elegance Boutique template — an editorial, magazine-inspired storefront designed for clothing, accessories, shoes, and elegance-forward brands. Thin-weight Playfair Display serif headings at large sizes create an editorial luxury feel, paired with Inter for UI body text. The design alternates between a warm off-white canvas (#FAF9F6) for shopping surfaces and a rich near-black (#111111) for the footer and newsletter bands, creating cinematic contrast. Lookbook-style product presentation, prominent color swatches, minimal navigation, and generous whitespace define the aesthetic. No shadows — depth comes from canvas contrast and photography.

colors:
  primary: "#111111"
  on-primary: "#FAFAFA"
  canvas-warm: "#FAF9F6"
  canvas-light: "#FFFFFF"
  ink: "#111111"
  ink-soft: "#2D2D2D"
  shade-30: "#E8E6E3"
  shade-40: "#A09E9B"
  shade-50: "#7A7876"
  hairline-warm: "#E0DEDA"
  surface-product: "#F5F4F1"
  surface-hover: "#F0EEEB"
  accent-blush: "#E8C4C4"
  accent-sage: "#C4D4C4"
  accent-taupe: "#C4B9AD"
  discount-text: "#C0392B"
  rating-star: "#D4A853"
  success-green: "#2D7D46"

typography:
  display-editorial:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: 56px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -0.5px
  display-lg:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: 40px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.3px
  display-md:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: 32px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0
  heading-lg:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0
  heading-md:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.3px
  heading-sm:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.8px
    textTransform: uppercase
  body-lg:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-md:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-strong:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.3px
  eyebrow:
    fontFamily: "Inter Variable, Inter, sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 1.5px
    textTransform: uppercase

rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 80px
  section-lg: 120px

components:
  btn-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    fontWeight: 500
    rounded: "{rounded.pill}"
    padding: 14px 32px
    letterSpacing: 0.5px
    hover: "background-color: #2D2D2D"
  btn-outline:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    border: "1px solid {colors.ink}"
    typography: "{typography.body-md}"
    fontWeight: 500
    rounded: "{rounded.pill}"
    padding: 14px 32px
    letterSpacing: 0.5px
    hover: "background-color: {colors.primary}; color: {colors.on-primary}"
  btn-outline-on-dark:
    backgroundColor: transparent
    textColor: "{colors.on-primary}"
    border: "1px solid rgba(250, 250, 250, 0.4)"
    typography: "{typography.body-md}"
    fontWeight: 500
    rounded: "{rounded.pill}"
    padding: 14px 32px
    letterSpacing: 0.5px
    hover: "background-color: {colors.on-primary}; color: {colors.primary}"
  card-product-image:
    backgroundColor: "{colors.surface-product}"
    rounded: "{rounded.lg}"
    aspectRatio: "3/4"
  card-review:
    backgroundColor: "{colors.canvas-light}"
    border: "1px solid {colors.hairline-warm}"
    rounded: "{rounded.lg}"
    padding: 24px
  input-text:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline-warm}"
    typography: "{typography.body-md}"
    rounded: "{rounded.pill}"
    padding: 14px 24px
  input-text-on-dark:
    backgroundColor: "rgba(250, 250, 250, 0.1)"
    textColor: "{colors.on-primary}"
    border: "1px solid rgba(250, 250, 250, 0.2)"
    typography: "{typography.body-md}"
    rounded: "{rounded.pill}"
    padding: 14px 24px
  color-swatch:
    size: 28px
    rounded: 9999px
    border: "2px solid transparent"
    activeBorder: "2px solid {colors.ink}"
    activeOffset: 3px
  size-pill:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline-warm}"
    rounded: "{rounded.pill}"
    padding: 10px 20px
    activeBackgroundColor: "{colors.primary}"
    activeTextColor: "{colors.on-primary}"
    activeBorder: "1px solid {colors.primary}"
  tag-eyebrow:
    backgroundColor: transparent
    textColor: "{colors.shade-40}"
    typography: "{typography.eyebrow}"
  block-newsletter:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    padding: 80px 40px
---

## Overview

The elegance template is a magazine-editorial storefront that makes products feel aspirational. Where the General template shouts with bold black uppercase headlines, elegance whispers with elegant Playfair Display serifs at thin weights — the kind of typography you'd see on Vogue, ELLE, or high-end boutique e-commerce like SSENSE or Net-a-Porter.

The canvas is warm off-white (`#FAF9F6`) — not clinical white, but a paper-like warmth that makes product photography feel editorial. The footer and newsletter bands flip to a rich near-black (`#111111`) for cinematic contrast, creating a high-elegance duality between light shopping surfaces and dark statement sections.

Product presentation is lookbook-style: tall 3:4 portrait cards that emphasize model and lifestyle shots over product-on-white shots. Color swatches appear as small circles with ring indicators. Size selection uses pills that invert to black-on-white when active. Everything is designed to make browsing feel like flipping through a curated elegance magazine.

Navigation is deliberately sparse — the elegance template strips away category mega-menus and dense search bars in favor of a minimal top bar that lets the content breathe. "Shop", "New In", and a search icon are all that appears. The search opens as a full-width overlay rather than an inline bar.

## Colors

### Brand & Surface
- **Primary** (`{colors.primary}` — `#111111`): Near-black. Buttons, footer, newsletter band. Not pure black — the slight warmth prevents harshness against the warm canvas.
- **On Primary** (`{colors.on-primary}` — `#FAFAFA`): Near-white text on dark surfaces.
- **Canvas Warm** (`{colors.canvas-warm}` — `#FAF9F6`): Main page background. Paper-warm off-white.
- **Canvas Light** (`{colors.canvas-light}` — `#FFFFFF`): Card backgrounds, inputs, areas that need contrast against the warm canvas.
- **Ink** (`{colors.ink}` — `#111111`): Primary text color on light surfaces.
- **Ink Soft** (`{colors.ink-soft}` — `#2D2D2D`): Slightly lighter than ink for body text. Creates a gentle hierarchy.
- **Surface Product** (`{colors.surface-product}` — `#F5F4F1`): Product image card backgrounds. Warmer than white, cooler than canvas.
- **Surface Hover** (`{colors.surface-hover}` — `#F0EEEB`): Hover state for interactive cards.

### Accents
- **Blush** (`{colors.accent-blush}` — `#E8C4C4`): Soft pink. Used sparingly for "Sale" or "New" tags.
- **Sage** (`{colors.accent-sage}` — `#C4D4C4`): Muted green. Used for success states, sustainability badges.
- **Taupe** (`{colors.accent-taupe}` — `#C4B9AD`): Neutral warm. Used for secondary badges, divider accents.
- **Rating Star** (`{colors.rating-star}` — `#D4A853`): Muted gold for star ratings — not garish yellow, but an editorial gold.
- **Discount Text** (`{colors.discount-text}` — `#C0392B`): Muted burgundy-red for sale prices. Not the screaming #FF3333 of the general template.
- **Success Green** (`{colors.success-green}` — `#2D7D46`): Deep green for verified badges.

### Shade Ladder
- **Shade-30** (`{colors.shade-30}` — `#E8E6E3`): Warm grey. Dividers, section backgrounds.
- **Shade-40** (`{colors.shade-40}` — `#A09E9B`): Secondary text on light.
- **Shade-50** (`{colors.shade-50}` — `#7A7876`): Tertiary text, placeholders.
- **Hairline Warm** (`{colors.hairline-warm}` — `#E0DEDA`): Card borders, input borders. Warmer than the general template's grey hairlines.

## Typography

### Font Families
- **Display**: Playfair Display (loaded via `next/font/google`, weights 400 and 500). A transitional serif with beautiful contrast between thick and thin strokes. Used for all display and editorial headings.
- **Body/UI**: Inter Variable (loaded via `next/font/google`). Clean sans-serif for all body text, buttons, captions, navigation.

### Hierarchy

| Token | Size | Weight | Line Height | Tracking | Use |
|---|---|---|---|---|---|
| `{typography.display-editorial}` | 56px | 400 | 1.1 | -0.5px | Hero headline |
| `{typography.display-lg}` | 40px | 400 | 1.15 | -0.3px | Section title, "New Arrivals" |
| `{typography.display-md}` | 32px | 400 | 1.2 | 0 | PDP product name, subsection title |
| `{typography.heading-lg}` | 24px | 500 | 1.25 | 0 | Card headings, footer store name |
| `{typography.heading-md}` | 18px | 500 | 1.4 | 0.3px | Navigation items (Inter) |
| `{typography.heading-sm}` | 14px | 600 | 1.4 | 0.8px, uppercase | Eyebrow above sections |
| `{typography.body-lg}` | 16px | 400 | 1.6 | 0 | Product descriptions |
| `{typography.body-md}` | 14px | 400 | 1.6 | 0 | Default body, buttons |
| `{typography.body-strong}` | 14px | 600 | 1.5 | 0 | Prices, bold body |
| `{typography.caption}` | 12px | 400 | 1.4 | 0.3px | Footnotes, footer links |
| `{typography.eyebrow}` | 11px | 600 | 1.2 | 1.5px, uppercase | Category labels, "NEW IN" |

### Principles
- **Playfair Display is the personality** — it gives the template its editorial, luxury feel. Use it generously for display headings but never for body text.
- **Inter is invisible** — it handles utility text (body, buttons, nav) without competing with the serif display.
- **Negative letter-spacing on large display sizes** (-0.5px at 56px) tightens the serifs for a magazine-cover feel.
- **Uppercase eyebrows** in Inter with wide letter-spacing (1.5px) create structured section labels — "NEW ARRIVALS", "TRENDING NOW", "SHOP BY CATEGORY".
- **Mixed-case display headings** — unlike the general template, elegance display headings are NOT uppercase. They use title case or sentence case for an editorial, approachable feel.

## Layout

### Page Structure
- **Home**: Full-bleed editorial hero (large lifestyle image, overlay headline in `{typography.display-editorial}`, single CTA pill) → "Shop by Category" asymmetric card grid → "New Arrivals" horizontal scroll carousel (portrait 3:4 cards) → "Trending Now" lookbook grid (2-row masonry) → Newsletter band (dark canvas).
- **PLP**: Collapsible filter sidebar + 3-column portrait product grid (tall cards, 3:4 ratio). No add-to-cart on cards — clicking navigates to PDP. Color swatch dots below product name.
- **PDP**: 60/40 split on desktop — large gallery left (primary image + vertical thumbnail strip), product details right (name in `{typography.display-md}`, price, color swatches as circles, size pills with inverted active state, quantity adjuster, add-to-cart pill). Below fold: "Complete the Look" carousel, Reviews section.
- **Cart**: Shared implementation with elegance template tokens.

### Product Cards (elegance Style)
- **Aspect ratio**: 3:4 portrait (taller cards emphasize model/lifestyle shots).
- **Image**: Full-bleed within the card, `{colors.surface-product}` background, `{rounded.lg}` corners.
- **Hover**: Subtle scale (1.02) and `{colors.surface-hover}` tint.
- **Below image**: Product name in `{typography.body-strong}`, price in `{typography.body-md}`, color swatch dots (small 8px circles in product's available colors).
- **No add-to-cart button on card** — the card is a navigation element to the PDP. The editorial experience encourages browsing, not impulse-adding.

### Grid
- Product grid: 3 columns desktop, 2 columns tablet, 2 columns mobile (elegance keeps 2-col on mobile for visual density).
- Card gap: `{spacing.lg}` (24px).
- Max content width: 1200px (slightly narrower than general for more editorial feel).

### Spacing Philosophy
The elegance template uses **generous whitespace** — sections breathe with `{spacing.section}` (80px) to `{spacing.section-lg}` (120px) between content bands. The hero section uses extreme vertical padding. This whitespace is the brand — it signals luxury and intentionality, in contrast to the general template's tighter, more efficient spacing.

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.sm}` | 4px | Small badges |
| `{rounded.md}` | 8px | Inputs on light (non-pill variant for search overlay) |
| `{rounded.lg}` | 12px | Product image cards, review cards |
| `{rounded.xl}` | 16px | Hero image containers |
| `{rounded.pill}` | 9999px | ALL buttons, text inputs, size pills, discount tags |

## Components

### Buttons
- **`btn-primary`** — Near-black pill, near-white text. Slightly lighter weight (500) than general. More refined hover: lightens to `#2D2D2D`. Letter-spacing 0.5px gives an editorial touch.
- **`btn-outline`** — Transparent pill with ink border. Hover inverts to filled black with white text (a elegance-specific interaction — the outline "fills in" on hover).
- **`btn-outline-on-dark`** — Used on the newsletter band and footer. Semi-transparent white border. Hover inverts to filled white with dark text.

### Color Swatches
- 28px circles with 2px transparent border.
- Active swatch: 2px solid `{colors.ink}` border with 3px offset (creates a ring effect).
- Swatches use the product variant's actual color as fill.

### Size Pills
- Default: White background, `{colors.hairline-warm}` border, pill shape.
- Active: **Inverted** — `{colors.primary}` background, `{colors.on-primary}` text. This is a elegance-template signature interaction.

### Navigation (elegance Navbar)
- Minimal, editorial. No category mega-menu.
- Layout: Store logo/name left (or centered), "Shop" and "New In" links, search icon, cart icon with badge.
- Search expands as a full-width overlay from the top — large input, real-time results, muted backdrop.
- Height: Compact (~56px). No bottom border — the navbar floats above the warm canvas.

### Footer (Dark Canvas)
- Background: `{colors.primary}` (#111111).
- Text: `{colors.on-primary}` with `{colors.shade-40}` for secondary links.
- Newsletter heading in `{typography.display-lg}` (Playfair Display) — editorial statement.
- Pill input + subscribe button on dark.
- Link columns, social icons, copyright, payment badges — all in muted tones.

## Do's and Don'ts

### Do
- Use Playfair Display in **mixed case** (title case or sentence case) for display headings — never uppercase.
- Use the warm canvas (`{colors.canvas-warm}`) as the primary page background — not pure white.
- Use portrait 3:4 aspect ratio for product cards — the tall format is the elegance template's visual identity.
- Use generous whitespace between sections (80–120px) — the breathing room signals luxury.
- Use the inverted size pill (black fill + white text on active) — it's a elegance-template signature.
- Use muted accent colors (blush, sage, taupe) — never saturated primaries.
- Use `{colors.discount-text}` burgundy-red for discounts — not bright red.

### Don't
- Don't use uppercase for display headings — that's the general template's territory.
- Don't add drop shadows, box shadows, or any shadow effects.
- Don't add add-to-cart buttons on product cards — the elegance template encourages browsing to PDP.
- Don't use dense navigation or mega-menus — the sparse nav is deliberate.
- Don't use pure white (#FFFFFF) as the page background — use `{colors.canvas-warm}` (#FAF9F6).
- Don't use bright, saturated colors for accents — the palette is muted and warm.
- Don't squeeze sections together — the whitespace is intentional and non-negotiable.
- Don't use square product cards — the 3:4 portrait format is the elegance template's identity.

## Responsive Behavior

| Breakpoint | Width | Key Changes |
|---|---|---|
| Desktop | ≥ 1024px | 3-col portrait grid, 60/40 PDP split, full editorial hero |
| Tablet | 768–1023px | 2-col portrait grid, collapsible filter sidebar, hero crops to focal subject |
| Mobile | < 768px | 2-col portrait grid (elegance keeps 2-col for visual density), stacked PDP, compact hero with centered text, hamburger nav |
