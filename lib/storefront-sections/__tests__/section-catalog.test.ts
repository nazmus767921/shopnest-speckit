import { expect, test, describe } from 'vitest'
import { SECTION_CATALOG, CORE_SECTIONS, OPTIONAL_SECTIONS, isCoreSection, isOptionalSection, SECTION_SORT_ORDER } from '../section-catalog'

describe('Section Catalog', () => {
  test('has exactly 10 sections total', () => {
    expect(SECTION_CATALOG.length).toBe(10)
  })

  test('has exactly 4 core sections', () => {
    expect(CORE_SECTIONS.length).toBe(4)
    expect(CORE_SECTIONS).toEqual(['hero', 'category_showcase', 'featured_products', 'footer'])
  })

  test('has exactly 6 optional sections', () => {
    expect(OPTIONAL_SECTIONS.length).toBe(6)
    expect(OPTIONAL_SECTIONS).toEqual([
      'announcement_bar',
      'promo_banner',
      'brand_story',
      'testimonials',
      'newsletter',
      'faq'
    ])
  })

  test('isCoreSection works correctly', () => {
    expect(isCoreSection('hero')).toBe(true)
    expect(isCoreSection('footer')).toBe(true)
    expect(isCoreSection('announcement_bar')).toBe(false)
    expect(isCoreSection('unknown')).toBe(false)
  })

  test('isOptionalSection works correctly', () => {
    expect(isOptionalSection('announcement_bar')).toBe(true)
    expect(isOptionalSection('newsletter')).toBe(true)
    expect(isOptionalSection('hero')).toBe(false)
    expect(isOptionalSection('unknown')).toBe(false)
  })

  test('SECTION_SORT_ORDER has correct values mapping to 0-9', () => {
    expect(Object.keys(SECTION_SORT_ORDER).length).toBe(10)
    
    // Check all values are unique and between 0-9
    const values = Object.values(SECTION_SORT_ORDER)
    const uniqueValues = new Set(values)
    expect(uniqueValues.size).toBe(10)
    
    for (const val of values) {
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(10)
    }

    expect(SECTION_SORT_ORDER.announcement_bar).toBe(0)
    expect(SECTION_SORT_ORDER.hero).toBe(1)
    expect(SECTION_SORT_ORDER.footer).toBe(9)
  })
})
