# storefront-template-fashion

## Purpose
This capability defines the "Fashion Boutique" template — an editorial, lookbook-inspired storefront layout designed for clothing, accessories, shoes, and fashion-forward brands. It emphasizes lifestyle photography, prominent color swatches, and a curated shopping experience.

## Requirements

### Requirement: Fashion Template Home Page Layout
The fashion template home page layout is section-driven. The `FashionHomePage` component MUST accept a `sections` prop (array of `StorefrontSection`) in addition to existing props (products, store info, etc.). The component MUST look up each section by key from the sections array and render the corresponding fashion section component. The section-driven components (`FashionHero`, `FashionMarquee`, `FashionCategoryMosaic`, `FashionBrandStory`) replace the previous inline hero and lookbook implementations. Sections that are toggled to not visible MUST be silently skipped without leaving empty space. The page MUST maintain the editorial aesthetic and generous whitespace between sections.

#### Scenario: Rendering fashion template home page
- **WHEN** a customer visits a store using the fashion template
- **THEN** the home page renders with full-bleed hero photography, editorial display typography, and lookbook-style product presentations that feel like a fashion magazine spread.

#### Scenario: FashionHomePage renders sections from props
- **WHEN** the storefront page fetches visible sections and passes them to FashionHomePage
- **THEN** the component renders each section using its fashion-specific component, maintaining the editorial aesthetic and generous whitespace between sections.

#### Scenario: Fashion home page with some sections hidden
- **WHEN** a fashion store has the "announcement_bar" and "about" sections set to is_visible = false
- **THEN** the homepage renders hero → category mosaic → new arrivals → featured products → FAQs, with no empty gaps where the hidden sections would have been.

#### Scenario: Fashion home page with no hero image
- **WHEN** a store using the fashion template has no hero image configured
- **THEN** the hero section renders with a sophisticated gradient background and the store name in large display typography, maintaining the editorial aesthetic.

### Requirement: Fashion Template PLP Layout
The fashion template PLP MUST display product cards in a 3-column portrait-oriented grid (taller cards to emphasize model/lifestyle imagery). The filter panel MUST appear as a collapsible sidebar. Product cards SHALL show the product image in a tall container, product name below the image in heading typography, price, and color swatch dots (if the product has color variants). The card SHALL NOT show an add-to-cart button — clicking the card navigates to the PDP.

#### Scenario: Fashion PLP product cards
- **WHEN** a customer views the PLP on a fashion template store
- **THEN** product cards render in portrait orientation with tall image containers, the product name in editorial typography, and color swatch indicators, without add-to-cart buttons on the cards.

#### Scenario: Fashion PLP color filter interaction
- **WHEN** a customer selects a color filter on the fashion PLP
- **THEN** the grid updates to show only products that have matching color variant options.

### Requirement: Fashion Template PDP Layout
The fashion template PDP MUST render a two-column layout on desktop with the image gallery occupying 60% width on the left (large primary image with vertical thumbnail strip) and product details on the right. The details section MUST prominently display: product name in display typography, price, color swatches as clickable circles with the active swatch outlined, size pills (active size pill uses inverted colors: black background, white text), quantity adjuster, and an add-to-cart pill button. Below the fold, a "Complete the Look" section SHALL show related products as a horizontal carousel. A "Reviews" section with verified-purchase badges MUST appear below.

#### Scenario: Selecting color on fashion PDP
- **WHEN** a customer clicks a color swatch on the fashion PDP
- **THEN** the active swatch receives a visible outline indicator, the product images update to show the selected color variant's images, and the price updates if the variant has a different price.

#### Scenario: Selecting size on fashion PDP
- **WHEN** a customer selects a size pill on the fashion PDP
- **THEN** the active size pill inverts its colors (black background, white text) and the variant selection updates.

### Requirement: Fashion Template Navigation
The fashion template navbar MUST be minimal and editorial: store logo/name centered or left-aligned, with a slim horizontal layout. Navigation items MUST include "Shop", "New In", and a search icon that expands to a search overlay. Cart icon with badge count on the right. The navbar MUST NOT include category mega-menus — fashion navigation is intentionally sparse and editorial.

#### Scenario: Fashion navbar search interaction
- **WHEN** a customer clicks the search icon on the fashion template navbar
- **THEN** a full-width search overlay slides down from the top with a large input field and real-time results.

### Requirement: Fashion Editorial Hero Section
The fashion template MUST render the "hero" section as a full-bleed, viewport-height lifestyle image with text overlay. The hero MUST display: the heading in Playfair Display display-editorial typography, subheading in Inter body text, and a pill-shaped CTA button. A dark gradient overlay MUST be applied over the image, controlled by the section's `overlayOpacity` value. If the section is not visible or not present, the hero MUST fall back to reading `store.heroImageUrl` and `store.subtitle` flat fields. If neither section nor flat fields have an image, the hero MUST render a warm gradient background with editorial typography.

#### Scenario: Rendering fashion editorial hero with section data
- **WHEN** a customer visits a fashion template store with a visible "hero" section containing a custom image and heading
- **THEN** the hero renders as a full-bleed background image with the heading overlaid in large Playfair Display typography, a gradient overlay at the configured opacity, and a pill CTA button.

#### Scenario: Fashion hero fallback to flat fields
- **WHEN** a fashion store has no "hero" section row but has `heroImageUrl` and `subtitle` set on the merchants table
- **THEN** the hero renders using the flat field values with default overlay settings.

#### Scenario: Fashion hero with no image
- **WHEN** a fashion store's hero section has no imageUrl and the flat heroImageUrl is also null
- **THEN** the hero renders with a warm gradient background and the store name in display typography, maintaining the editorial aesthetic.

### Requirement: Fashion Announcement Marquee
The fashion template MUST render the "announcement_bar" section as a thin horizontal strip with scrolling text. Messages from the section's `messages` array MUST scroll continuously in a marquee animation at the configured speed. Each message MAY be a clickable link if the message has a `link` value. The marquee MUST use the fashion template's eyebrow typography (Inter, 11px, uppercase, wide letter-spacing) and the warm canvas background.

#### Scenario: Rendering marquee with multiple messages
- **WHEN** a fashion store has a visible "announcement_bar" section with 3 messages
- **THEN** the marquee renders as a thin strip below the hero, scrolling all 3 messages continuously in sequence, with the configured speed.

#### Scenario: Marquee message with link
- **WHEN** a marquee message has a link URL configured
- **THEN** clicking that message text navigates to the specified URL.

### Requirement: Fashion Asymmetric Category Mosaic
The fashion template MUST render the "category_showcase" section as an asymmetric grid layout — NOT equal-sized boxes. For 3 tiles, the layout MUST be: one large tile (spanning 2/3 width) on the left and two smaller tiles (stacked, 1/3 width) on the right. For 2 tiles, the layout MUST be a 50/50 split. For 4 tiles, the layout MUST be a 2x2 grid with the first tile spanning two rows. Each tile MUST display a lifestyle image with a dark gradient overlay at the bottom, the tile label in Playfair Display heading typography, and the eyebrow text "Collection" in uppercase Inter. Tiles MUST link to their configured `linkUrl`. Tile images MUST have a subtle scale-up hover animation.

#### Scenario: Rendering 3-tile asymmetric mosaic
- **WHEN** a fashion store has a visible "category_showcase" section with 3 tiles
- **THEN** the mosaic renders with one large tile on the left (2/3 width, full height) and two smaller tiles stacked on the right (1/3 width each), each with image, gradient overlay, and label text.

#### Scenario: Mosaic tile hover interaction
- **WHEN** a customer hovers over a mosaic tile
- **THEN** the tile image scales up subtly (1.03) with a smooth transition, creating an editorial browsing feel.

### Requirement: Fashion Brand Story Editorial Split
The fashion template MUST render the "about" section as a 50/50 horizontal split on desktop — a lifestyle image on one side and editorial text content on the other. The text side MUST display the eyebrow in uppercase Inter typography, the heading in Playfair Display display-lg typography, the body text in Inter body-lg, and an optional CTA pill button. The `imagePosition` field determines whether the image is on the left or right. On mobile, the layout MUST stack vertically with the image above the text.

#### Scenario: Rendering brand story with image on left
- **WHEN** a fashion store has a visible "about" section with imagePosition set to "left"
- **THEN** the brand story renders as a 50/50 split with the lifestyle image on the left and the editorial text (eyebrow, heading, body, CTA) on the right.

#### Scenario: Brand story responsive stacking
- **WHEN** a customer views the brand story section on a mobile viewport
- **THEN** the layout stacks vertically with the image on top and the text content below.

### Requirement: Fashion Homepage Section Rendering Order
The fashion template homepage MUST render sections in the following fixed order: (1) editorial hero, (2) announcement marquee, (3) category mosaic, (4) new arrivals product carousel (auto from products), (5) brand story, (6) curated exclusives product carousel (auto from products), (7) FAQ accordion (from store.customFaqs). Sections that are toggled to not visible MUST be silently skipped without leaving empty space.

#### Scenario: Fashion homepage section order
- **WHEN** a customer visits a fashion template store with all sections visible
- **THEN** the homepage renders sections in order: hero, marquee, category mosaic, new arrivals, brand story, exclusives, FAQs.

### Requirement: Fashion Template Footer
The fashion template footer MUST render with a dark canvas background, editorial typography, and a newsletter signup section with the heading in display typography. It SHALL include link columns, social media icons, copyright text, and payment badges, all styled against the dark background with light text.

#### Scenario: Fashion footer newsletter section
- **WHEN** a customer views the footer on a fashion template store
- **THEN** the newsletter section renders with a dark background, display-weight heading, and a pill-shaped email input with a subscribe button.
