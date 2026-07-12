## ADDED Requirements

### Requirement: Preview Route
The storefront MUST serve a preview route at `/{subdomain}/preview` that renders the merchant's homepage sections client-side. The preview page MUST load initial section and theme data from the database on first render. The preview page MUST listen for `postMessage` events from the parent window to receive draft section and theme updates.

#### Scenario: Preview route loads with saved data
- **WHEN** a browser navigates to `mystore.localhost:3000/preview`
- **THEN** the page renders the merchant's saved homepage sections using the actual storefront section components (FullBleedHero, AnnouncementMarquee, BrandStory, FaqSection) and the saved theme CSS variables

#### Scenario: Preview route is inaccessible on main domain
- **WHEN** a browser navigates to `localhost:3000/preview` (no subdomain)
- **THEN** the route does not match and returns 404

### Requirement: postMessage Communication Protocol
The preview page MUST accept messages of type `preview-update` containing `{ sections, themeSettings }` and re-render the homepage sections with the received draft data. The preview page MUST accept messages of type `focus-section` containing `{ sectionKey }` and scroll the corresponding section into view with smooth scrolling. The preview page MUST send a `preview-ready` message to the parent window when the client component has mounted and is ready to receive updates. The preview MUST validate `event.origin` before processing any message.

#### Scenario: Real-time section update via postMessage
- **WHEN** the dashboard sends `{ type: 'preview-update', sections: [...], themeSettings: {...} }`
- **THEN** the preview re-renders all visible sections with the new content without a full page reload

#### Scenario: Theme update cascades to all elements
- **WHEN** the dashboard sends a `preview-update` with a changed `themeSettings.colors.primary`
- **THEN** the preview sets the CSS variable `--color-primary` on `document.documentElement` and all elements using that variable (buttons, accents, navbar) visually update

#### Scenario: Section scroll-sync
- **WHEN** the dashboard sends `{ type: 'focus-section', sectionKey: 'hero' }`
- **THEN** the preview scrolls the hero section into view with `behavior: 'smooth'`

#### Scenario: Ignoring messages from unauthorized origins
- **WHEN** a postMessage event arrives from an origin other than the dashboard
- **THEN** the preview ignores the message and does not update state

### Requirement: Async Section Placeholders
Sections that require server-side data fetching (product grids, category showcase) MUST render as styled placeholder cards in the preview. The placeholder MUST display the section type label and the configured title from the section content. The placeholder MUST be styled consistently with the storefront theme (using CSS variables for colors and border-radius).

#### Scenario: Product grid placeholder
- **WHEN** the preview renders a section with sectionKey `product_grid_featured` and content title "Featured Products"
- **THEN** a placeholder card is displayed showing "Product Grid — Featured Products" with themed styling

#### Scenario: Category showcase placeholder
- **WHEN** the preview renders a section with sectionKey `category_showcase` and content title "Shop by Category"
- **THEN** a placeholder card is displayed showing "Category Showcase — Shop by Category" with themed styling

### Requirement: Section Wrapper IDs for Scroll Targeting
Each section rendered in the preview MUST be wrapped in a container element with `id="preview-section-{sectionKey}"` to enable scroll targeting from `focus-section` messages.

#### Scenario: Hero section has scroll target ID
- **WHEN** the preview renders the hero section
- **THEN** the hero section wrapper has `id="preview-section-hero"`
