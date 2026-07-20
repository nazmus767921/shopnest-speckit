import { expect, test, describe } from 'vitest'
import { assignColorRhythm } from '../color-rhythm'

describe('assignColorRhythm', () => {
  test('assigns colors alternatingly', () => {
    const visibleSectionKeys = ['hero', 'category_showcase', 'featured_products', 'footer']
    const rhythmPattern = ['light', 'dark', 'accent']
    
    const result = assignColorRhythm(visibleSectionKeys, rhythmPattern)
    
    expect(result['hero']).toBe('light')
    expect(result['category_showcase']).toBe('dark')
    expect(result['featured_products']).toBe('accent')
    expect(result['footer']).toBe('light') // Wraps around
  })

  test('skips hidden sections and maintains rhythm for visible ones', () => {
    const allSections = ['hero', 'category_showcase', 'featured_products', 'footer']
    const hiddenSections = ['category_showcase']
    const visibleSectionKeys = allSections.filter(k => !hiddenSections.includes(k))
    const rhythmPattern = ['light', 'dark', 'accent']
    
    const result = assignColorRhythm(visibleSectionKeys, rhythmPattern)
    
    expect(result['hero']).toBe('light')
    expect(result['featured_products']).toBe('dark') // Skips category_showcase, maintains rhythm
    expect(result['footer']).toBe('accent')
  })

  test('handles empty visible sections', () => {
    const result = assignColorRhythm([], ['light', 'dark'])
    expect(result).toEqual({})
  })

  test('handles single pattern color', () => {
    const visibleSectionKeys = ['hero', 'category_showcase']
    const result = assignColorRhythm(visibleSectionKeys, ['light'])
    expect(result['hero']).toBe('light')
    expect(result['category_showcase']).toBe('light')
  })
})
