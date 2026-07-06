# storefront-template-general

## Purpose
This capability defines the "General Store" template — a versatile, all-purpose storefront layout suitable for any business type. It evolves from the current storefront implementation but is restructured as a template module.

## ADDED Requirements

### Requirement: General Template Home Page Layout
The general template home page MUST render the following sections in order: (1) hero banner with store name, subtitle, and CTA, (2) category banner grid showing top categories, (3) featured products row via `ProductSlider`, (4) new arrivals grid, (5) newsletter signup section, and (6) FAQ accordion (if the merchant has custom FAQs).

#### Scenario: Rendering general template home page with complete store data
- **WHEN** a customer visits a store using the general template that has a hero image, categories, products, and FAQs configured
- **THEN** the home page renders all six sections with the store's actual data, using the general template's design tokens for colors, typography, and spacing.

#### Scenario: Rendering general template home page with minimal store data
- **WHEN** a customer visits a store using the general template that has no hero image, no categories, and fewer than 4 products
- **THEN** the home page renders gracefully — the hero section uses a fallback gradient background, the category section is omitted, and the product sections show whatever products are available without visual gaps.

### Requirement: General Template PLP Layout
The general template product listing page MUST display a filter sidebar on the left (categories, price range, color swatches, size grid) and a product grid on the right. The grid SHALL use 3 columns on desktop, 2 on tablet, and 1 on mobile. Product cards SHALL show the product image, name, star rating, price, and an icon-only add-to-cart button.

#### Scenario: Filtering products on general PLP
- **WHEN** a customer selects a category and a color filter on the general template PLP
- **THEN** the product grid updates to show only matching products, preserving the grid layout and card styling.

### Requirement: General Template PDP Layout
The general template PDP MUST render a two-column layout on desktop: image gallery on the left (with thumbnail strip) and product details on the right (name, rating, price, variant pickers, quantity selector, add-to-cart button, description tabs). On mobile, the layout SHALL stack vertically.

#### Scenario: Viewing product details on general PDP
- **WHEN** a customer visits a product page on a store using the general template
- **THEN** the PDP renders the image gallery, product info, variant selectors, and add-to-cart button in the standard two-column layout.

### Requirement: General Template Navigation
The general template navbar MUST display the store logo/name on the left, a search bar in the center, and cart/account icons on the right. On desktop, category navigation links SHALL appear below the main nav bar. On mobile, the navbar MUST collapse to a hamburger menu.

#### Scenario: Mobile navigation on general template
- **WHEN** a customer visits a general template store on a mobile device and taps the hamburger menu
- **THEN** a slide-out menu appears showing navigation links, search, and account options.

### Requirement: General Template Footer
The general template footer MUST display the store name and description, organized link columns (Company, Help, FAQ, Resources), a newsletter signup block, social media links, copyright text, and payment method badges.

#### Scenario: Footer renders with merchant social links
- **WHEN** a store using the general template has Facebook and Instagram social links configured
- **THEN** the footer displays clickable social icons for Facebook and Instagram alongside the store description.
