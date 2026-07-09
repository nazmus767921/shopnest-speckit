# storefront-theme-redesign

## MODIFIED Requirements

### Requirement: Storefront Theme Selection and Subscription Enforcement
The system MUST replace the CSS-only theme system (`merchants.theme` with values `"default"` / `"cinematic"`) with a full template module system (`merchants.template` with values matching `store_templates.slug`). The settings form SHALL display a visual template gallery instead of a theme dropdown. Template selection SHALL be restricted by subscription tier as defined in `store_templates.allowed_tiers`, replacing the previous hardcoded `"cinematic"` → `"growth"` restriction.

#### Scenario: Starter plan merchant views template gallery
- **WHEN** a merchant on the "starter" plan opens the template settings page
- **THEN** the page displays a visual gallery of all active templates, with templates outside the merchant's tier shown as locked with an upgrade prompt, replacing the previous theme dropdown.

#### Scenario: Growth plan merchant selects premium template
- **WHEN** a merchant on the "growth" plan selects the "fashion" template from the gallery and confirms
- **THEN** the database is updated with `template = 'fashion'` and the storefront pages render using the fashion template's page components and design tokens.

### Requirement: Scoped Storefront Styling Override
The system MUST replace `.storefront-theme-default` and `.storefront-theme-cinematic` CSS wrapper classes with `.storefront-template-<slug>` classes (e.g., `.storefront-template-general`, `.storefront-template-fashion`). Each template's CSS custom properties SHALL be defined in a per-template stylesheet rather than in `globals.css`. The system SHALL scope template styles so they do not affect dashboard or admin pages.

#### Scenario: Rendering storefront page with template class
- **WHEN** the user accesses any page under the storefront subdomain route
- **THEN** the page container receives the class `storefront-template-<slug>` matching the merchant's active template, and CSS custom properties resolve to that template's design tokens.

### Requirement: Storefront Font Integration
The system MUST allow each template to define its own display and body font families. The general template SHALL use `Archivo Black` as the display font and `Inter` for body text. The fashion template SHALL define its own font configuration in its DESIGN.md file. Font loading MUST occur at the layout level based on the resolved template.

#### Scenario: Displaying storefront header with template fonts
- **WHEN** the storefront navbar and page titles are rendered for a store using the general template
- **THEN** the text uses `Archivo Black` for display headings and `Inter` for body text.

#### Scenario: Displaying storefront header with fashion template fonts
- **WHEN** the storefront navbar and page titles are rendered for a store using the fashion template
- **THEN** the text uses the font families defined in `designmd/DESIGN-fashion.md`.
