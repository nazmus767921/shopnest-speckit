import { expect, test, describe } from 'vitest'
import { defaultStorefrontSections } from '../defaults'
import { SECTION_CATALOG, SECTION_SORT_ORDER } from '../section-catalog'

describe('Default Storefront Sections', () => {
  test('has exactly 10 entries', () => {
    expect(defaultStorefrontSections.length).toBe(10)
  })

  test('contains all keys from SECTION_CATALOG', () => {
    const keys = defaultStorefrontSections.map(s => s.sectionKey)
    expect(keys.length).toBe(SECTION_CATALOG.length)
    for (const section of SECTION_CATALOG) {
      expect(keys).toContain(section.key)
    }
  })

  test('sortOrder matches SECTION_SORT_ORDER', () => {
    for (const section of defaultStorefrontSections) {
      expect(section.sortOrder).toBe(SECTION_SORT_ORDER[section.sectionKey as keyof typeof SECTION_SORT_ORDER])
    }
  })

  test('isVisible is true for all defaults except newly seeded optional sections', () => {
    for (const section of defaultStorefrontSections) {
      if (['promo_banner', 'testimonials', 'newsletter'].includes(section.sectionKey)) {
        expect(section.isVisible).toBe(false)
      } else {
        expect(section.isVisible).toBe(true)
      }
    }
  })
})
