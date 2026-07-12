## ADDED Requirements

### Requirement: Dynamic Typography Inheritance
The storefront templates and sections SHALL not hardcode static fonts. They SHALL rely on the `--font-heading` and `--font-body` CSS variables injected at the layout level by the theme configuration. Dashboard font selection options SHALL include "Archivo Black" to allow merchants to explicitly retain the original hardcoded look.

#### Scenario: Merchant changes typography
- **WHEN** a merchant selects a new heading font and body font in the dashboard (or selects "Archivo Black")
- **THEN** all storefront templates and sections (including Hero, FAQ, Brand Story) dynamically inherit and display the newly selected fonts without being overridden by local CSS files.

### Requirement: Robust WhatsApp URL Parsing
The storefront footers SHALL correctly parse WhatsApp input configurations to support both full URLs and raw phone numbers without destructive formatting.

#### Scenario: Merchant provides a full WhatsApp URL
- **WHEN** a merchant inputs `https://api.whatsapp.com/send?phone=123456789` for the WhatsApp social link
- **THEN** the footer link uses the exact URL provided instead of stripping alphabetical characters.

#### Scenario: Merchant provides a raw phone number
- **WHEN** a merchant inputs `+1 (555) 123-4567` for the WhatsApp social link
- **THEN** the footer link strips non-numeric characters and generates the URL `https://wa.me/15551234567`.

### Requirement: Fashion Footer Social Links Parity
The Fashion Template Footer SHALL support all social link platforms provided by the section configuration, specifically adding support for TikTok and WhatsApp.

#### Scenario: Fashion store configures TikTok and WhatsApp
- **WHEN** a merchant using the Fashion template provides TikTok and WhatsApp URLs
- **THEN** the Fashion footer renders clickable icons for TikTok and WhatsApp alongside Facebook and Instagram.

### Requirement: Hero Image Overlay Opacity
The `FullBleedHero` section SHALL apply the `overlayOpacity` setting from the database to darken the background image, ensuring text legibility.

#### Scenario: Hero section with 60% opacity
- **WHEN** a merchant sets `overlayOpacity` to 60 on a hero section with a background image
- **THEN** the hero section renders a dark overlay over the image with an opacity of 0.6.
