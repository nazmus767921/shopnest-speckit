## ADDED Requirements

### Requirement: Curated Font Registry
The system MUST provide a curated registry of Google Font pairs, each defining a heading font and a body font. The registry MUST include at least 6 font pairs covering a range of styles (classic, modern, bold, elegant, clean, editorial). Each font MUST be preloaded at build time via `next/font/google` with `variable` mode and the `latin` subset. Each font MUST generate a CSS custom property (e.g., `--font-playfair-display`).

#### Scenario: Font registry contains expected pairs
- **WHEN** the font registry is loaded
- **THEN** it contains at least 6 font pair entries, each with a unique `id`, `headingFont`, and `bodyFont` field

### Requirement: Typography CSS Variable Generation
The `getThemeVariables` function MUST generate `--font-heading` and `--font-body` CSS variables when `themeSettings.typography.headingFont` or `themeSettings.typography.bodyFont` are set. The generated values MUST be valid CSS `font-family` declarations referencing the corresponding `next/font/google` CSS custom property with appropriate fallback stacks.

#### Scenario: Theme with typography generates font CSS vars
- **WHEN** `getThemeVariables` is called with `{ typography: { headingFont: 'Playfair Display', bodyFont: 'Inter' } }`
- **THEN** the returned object includes `--font-heading` set to the Playfair Display font family with serif fallback, and `--font-body` set to Inter with sans-serif fallback

#### Scenario: Theme without typography omits font CSS vars
- **WHEN** `getThemeVariables` is called with `{ colors: { primary: '#000' } }` and no `typography` field
- **THEN** the returned object does not include `--font-heading` or `--font-body`

### Requirement: Storefront Font Class Application
The storefront layout MUST apply all curated font CSS variable classes to the root wrapper element so that all font custom properties are available to descendant elements. The storefront CSS MUST use `var(--font-heading, ...)` and `var(--font-body, ...)` for heading and body text styling respectively.

#### Scenario: Storefront renders with custom heading font
- **WHEN** a merchant has set `headingFont: 'Cormorant Garamond'` in their theme settings
- **THEN** the storefront heading elements use the Cormorant Garamond font face

### Requirement: Dashboard Typography Selector
The Templates dashboard Global Theme Settings accordion MUST include a "Typography" subsection with two `<Select>` dropdowns: one for heading font and one for body font. Each dropdown option MUST list the font name rendered in that font face for visual identification. The selectors MUST update `themeSettings.typography.headingFont` and `themeSettings.typography.bodyFont` in the editor state, triggering a live preview update via postMessage.

#### Scenario: Merchant selects a heading font
- **WHEN** a merchant opens the heading font dropdown and selects "Cormorant Garamond"
- **THEN** the theme settings state updates with `headingFont: 'Cormorant Garamond'` and the preview iframe updates to show the new heading font

#### Scenario: Font selector shows font preview in dropdown
- **WHEN** a merchant opens the heading font dropdown
- **THEN** each option text is rendered using its own font face (e.g., "Playfair Display" is shown in Playfair Display)
