## 1. Core Logic & Tests

- [x] 1.1 Write failing unit tests for a new WhatsApp URL parsing utility to handle both raw phone numbers and full URLs
- [x] 1.2 Implement the robust WhatsApp parsing utility function (e.g., `parseWhatsAppUrl`) to pass the tests
- [x] 1.3 Add "Archivo Black" to the font selection options in the dashboard (e.g., in `lib/fonts.ts`)

## 2. Global Template CSS

- [x] 2.1 Remove hardcoded `--font-display` and `--font-sans` overrides from `templates/general/styles.css`
- [x] 2.2 Remove hardcoded `--font-display` and `--font-sans` overrides from `templates/fashion/styles.css`

## 3. Section Component Refactoring

- [x] 3.1 Update `FullBleedHero.tsx` to use dynamic font variables instead of hardcoded `font-serif`/`font-sans`
- [x] 3.2 Update `BrandStory.tsx` to use dynamic font variables instead of hardcoded `font-display`/`font-sans`
- [x] 3.3 Update `FaqSection.tsx` to use dynamic font variables instead of hardcoded `font-sans`
- [x] 3.4 Update `CategoryMosaic.tsx` to use dynamic font variables and respect theme colors (removing hardcoded text colors)

## 4. Feature Enhancements

- [x] 4.1 Update `GeneralFooter.tsx` to use the new robust `parseWhatsAppUrl` utility
- [x] 4.2 Update `FashionFooter.tsx` to add TikTok and WhatsApp social link icons (achieving parity with General footer)
- [x] 4.3 Update `FashionFooter.tsx` to use the new robust `parseWhatsAppUrl` utility
- [x] 4.4 Add the `overlayOpacity` styling to the background image in `FullBleedHero.tsx` (e.g., `style={{ opacity: overlayOpacity / 100 }}`)
