## 1. Core Logic & Tests

- [ ] 1.1 Write failing unit tests for a new WhatsApp URL parsing utility to handle both raw phone numbers and full URLs
- [ ] 1.2 Implement the robust WhatsApp parsing utility function (e.g., `parseWhatsAppUrl`) to pass the tests
- [ ] 1.3 Add "Archivo Black" to the font selection options in the dashboard (e.g., in `lib/fonts.ts`)

## 2. Global Template CSS

- [ ] 2.1 Remove hardcoded `--font-display` and `--font-sans` overrides from `templates/general/styles.css`
- [ ] 2.2 Remove hardcoded `--font-display` and `--font-sans` overrides from `templates/fashion/styles.css`

## 3. Section Component Refactoring

- [ ] 3.1 Update `FullBleedHero.tsx` to use dynamic font variables instead of hardcoded `font-serif`/`font-sans`
- [ ] 3.2 Update `BrandStory.tsx` to use dynamic font variables instead of hardcoded `font-display`/`font-sans`
- [ ] 3.3 Update `FaqSection.tsx` to use dynamic font variables instead of hardcoded `font-sans`
- [ ] 3.4 Update `CategoryMosaic.tsx` to use dynamic font variables and respect theme colors (removing hardcoded text colors)

## 4. Feature Enhancements

- [ ] 4.1 Update `GeneralFooter.tsx` to use the new robust `parseWhatsAppUrl` utility
- [ ] 4.2 Update `FashionFooter.tsx` to add TikTok and WhatsApp social link icons (achieving parity with General footer)
- [ ] 4.3 Update `FashionFooter.tsx` to use the new robust `parseWhatsAppUrl` utility
- [ ] 4.4 Add the `overlayOpacity` styling to the background image in `FullBleedHero.tsx` (e.g., `style={{ opacity: overlayOpacity / 100 }}`)
