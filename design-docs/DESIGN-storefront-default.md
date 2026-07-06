---
version: 1.0.0
name: Shop-co-design-system
description: A bold, high-contrast, mobile-first e-commerce design system. The visual language relies heavily on stark black and white contrasts, rounded pill-shaped components, light gray surface treatments for product imagery, and a heavy, extended display typeface for headers. Red is used strictly for discounts and destructive actions, while yellow is reserved for ratings.

colors:
  primary: "#000000"
  on-primary: "#ffffff"
  surface-default: "#ffffff"
  surface-product: "#F0EEED"
  surface-secondary: "#F2F0F1"
  text-primary: "#000000"
  text-secondary: "#666666"
  text-tertiary: "#999999"
  hairline: "#E5E5E5"
  discount-bg: "#FF33331A" # 10% opacity red
  discount-text: "#FF3333"
  rating-star: "#FFC633"
  success-green: "#01AB31"

typography:
  display-huge:
    fontFamily: "Integral CF, Archivo Black, sans-serif"
    fontSize: 48px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: 0
    textTransform: uppercase
  display-lg:
    fontFamily: "Integral CF, Archivo Black, sans-serif"
    fontSize: 40px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: 0
    textTransform: uppercase
  heading-lg:
    fontFamily: "Integral CF, Archivo Black, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  heading-md:
    fontFamily: "Integral CF, Archivo Black, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  heading-sm:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0
  body-lg:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-md:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-strong:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 20px
  pill: 9999px
  circle: 50%

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 40px
  huge: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: 16px 32px
  button-secondary:
    backgroundColor: "{colors.surface-secondary}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: 16px 32px
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    border: "1px solid {colors.hairline}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: 16px 32px
  tag-discount:
    backgroundColor: "{colors.discount-bg}"
    textColor: "{colors.discount-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  card-product-image:
    backgroundColor: "{colors.surface-product}"
    rounded: "{rounded.md}"
    padding: 0
  card-review:
    backgroundColor: "transparent"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    padding: 24px
  card-order-summary:
    backgroundColor: "transparent"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.lg}"
    padding: 16px 20px # p-4 md:p-5 (narrow cards inner padding)
  input-text:
    backgroundColor: "{colors.surface-secondary}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.pill}"
    padding: 16px 24px
    border: "none"
  newsletter-block:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    padding: 32px 40px
---

## Overview

SHOP.CO relies on a stark, high-contrast visual language. The brand is defined by heavy, ultra-bold typography for headlines and soft, rounded shapes for UI elements like buttons, inputs, and product image containers. There are no heavy drop shadows; depth is created through the contrast of light gray product containers (`#F0EEED`) against a pure white background.

**Key Characteristics:**
- Type contrast is extreme: `{typography.display-huge}` is heavy and wide, paired with a clean, highly legible geometric sans (like Satoshi or Inter) for body copy.
- Nearly all interactive elements (buttons, size selectors, quantity adjustments, inputs) utilize `{rounded.pill}`.
- Product images strictly sit on `{colors.surface-product}` without borders or shadows.
- Red is used exclusively as a utility color for discounts and deleting items from the cart.

## Colors

### Surface & Backgrounds
- **Surface Default** (`{colors.surface-default}` — `#ffffff`): Primary background for all pages.
- **Surface Product** (`{colors.surface-product}` — `#F0EEED`): The standard backdrop for all product cutouts.
- **Surface Secondary** (`{colors.surface-secondary}` — `#F2F0F1`): Used for unselected size pills, quantity selectors, search bars, and text inputs.

### Text & Accents
- **Primary Text** (`{colors.text-primary}` — `#000000`): Headers, primary body copy, active states.
- **Secondary Text** (`{colors.text-secondary}` — `#666666`): Descriptions, breadcrumbs.
- **Tertiary Text** (`{colors.text-tertiary}` — `#999999`): Strikethrough original prices, placeholder text.
- **Hairline** (`{colors.hairline}` — `#E5E5E5`): Card borders (reviews, order summary), tab outlines, filter separators.
- **Discount Red** (`{colors.discount-text}` — `#FF3333`): Used for "-20%", "-40%" text.
- **Rating Yellow** (`{colors.rating-star}` — `#FFC633`): Standard star rating color.

## Typography

The design features two distinct typeface families. The display font is an ultra-bold, slightly extended sans-serif (e.g., Integral CF or Archivo Black) used exclusively for massive impact (Logo, Main Product Titles, Marketing Blocks). The UI font is a geometric sans-serif (e.g., Satoshi or Inter) used for all prices, descriptions, inputs, and buttons.

> [!IMPORTANT]
> **Font-Family Scoping (Satoshi vs. Archivo Black)**:
> To look premium and professional, display font is reserved **strictly** for massive page-level titles. All section headers, card titles, product listings, buttons, and summary items must use the clean geometric sans-serif (`var(--font-sans)` / Satoshi) to prevent a cluttered, cheap aesthetic.

### Hierarchy

| Token | Use |
|---|---|
| `{typography.display-huge}` | Newsletter block header, "OUR HAPPY CUSTOMERS" |
| `{typography.display-lg}` | Main product title on PDP ("ONE LIFE GRAPHIC T-SHIRT") |
| `{typography.heading-lg}` | "YOUR CART", "Casual" category title |
| `{typography.heading-md}` | Section headers ("You might also like") |
| `{typography.heading-sm}` | Product titles in PLP grids, Reviewer names |
| `{typography.body-lg}` | Main prices ($260) |
| `{typography.body-md}` | Default product descriptions, review text |
| `{typography.body-strong}` | Button text, labels |

## Components

### Buttons
**`button-primary`**
- Pure black background, white text. Used for "Add to Cart", "Go to Checkout", "Subscribe to Newsletter", "Apply". Spans 100% width on mobile forms.

**`button-secondary`**
- Light gray background (`#F2F0F1`), black text. Used for "Load More Reviews".

**Size Selectors & Quantity Adjusters**
- Default to `{colors.surface-secondary}` with black text.
- Selected state inverses to pure black background with white text.
- Steppers feature a height of `h-9 md:h-10` with horizontal padding `px-2.5 md:px-4` and gaps of `gap-2.5 md:gap-3`.

### Cards & Blocks

**`card-product-image`**
- Light gray (`#F0EEED`), `{rounded.md}` (16px). No border, no drop shadow. Used universally on PLP grids and PDP galleries.

**`card-review`**
- Transparent background, 1px solid hairline border, `{rounded.md}`. Contains stars, name, checkmark, and text.

**`card-order-summary`**
- Transparent background, 1px solid hairline border, `{rounded.lg}` (20px). Features narrow card padding of `p-4 md:p-5`.

**`newsletter-block`**
- Pure black container, `{rounded.lg}` (20px). Features a white email input inside. Sits directly above the footer.

**Discount Tag**
- Uses `{colors.discount-bg}` (a 10% opacity wash of red) and `{colors.discount-text}`. Always `{rounded.pill}`.

## Layout & Responsive Behavior

### Grids & Container Widths
- **Global Page Container**: Enforced at the root app shell container level with `max-w-7xl mx-auto` and a narrow padding constraint of `px-4 md:px-8`.
- **PLP (Category):** 3 or 4 columns on Desktop. Strictly 2 columns on Mobile.
- **Cart:** Split layout on Desktop (Cart items take up ~65% width left, Order Summary takes ~35% width right). Stacked strictly on Mobile.

### Navigation
- **Desktop:** Inline links center-aligned, Search bar expanded in the middle, Icons right-aligned.
- **Mobile:** Collapses to a hamburger menu on the far left. Search becomes an icon rather than an expanded input.

### Image Carousels
- On mobile PDP, the product images stack horizontally with snap scrolling and are indicated by pagination dots below the image.
