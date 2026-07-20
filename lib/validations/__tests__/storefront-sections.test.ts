import { expect, test, describe } from 'vitest'
import {
  heroContentSchema,
  announcementBarContentSchema,
  categoryShowcaseContentSchema,
  featuredProductsContentSchema,
  promoBannerContentSchema,
  brandStoryContentSchema,
  testimonialsContentSchema,
  newsletterContentSchema,
  faqContentSchema,
  footerContentSchema,
  storefrontSectionInputSchema
} from '../storefront-sections'

describe('Storefront Section Validation Schemas', () => {
  test('heroContentSchema strips unknown fields and validates correctly', () => {
    const valid = { title: "Title", subtitle: "Sub", buttonText: "Shop", buttonLink: "/", imageUrl: "http://img.com" }
    expect(heroContentSchema.parse(valid)).toEqual(valid)
    
    const withExtra = { ...valid, extraField: "should be stripped" }
    const parsed = heroContentSchema.parse(withExtra)
    expect(parsed).not.toHaveProperty('extraField')
  })

  test('announcementBarContentSchema strips extra fields', () => {
    const data = { text: "Sale!", link: "/sale", bg: "red" }
    const parsed = announcementBarContentSchema.parse(data)
    expect(parsed).toEqual({ text: "Sale!", link: "/sale" })
    expect(parsed).not.toHaveProperty('bg')
  })

  test('categoryShowcaseContentSchema validates', () => {
    expect(categoryShowcaseContentSchema.parse({ title: "Cats" })).toEqual({ title: "Cats", categoryIds: [] })
  })

  test('featuredProductsContentSchema validates', () => {
    expect(featuredProductsContentSchema.parse({ title: "Featured", gridType: "new_arrivals" })).toEqual({ title: "Featured", gridType: "new_arrivals" })
  })

  test('promoBannerContentSchema validates', () => {
    const valid = { title: "Promo", subtitle: "Sub", buttonText: "Btn", buttonLink: "/link", imageUrl: "http://img.com/url.jpg" }
    expect(promoBannerContentSchema.parse(valid)).toEqual(valid)
  })

  test('brandStoryContentSchema validates', () => {
    const valid = { title: "Story", description: "Desc", imageUrl: "http://img.com/img.jpg", buttonText: "Btn", buttonLink: "link" }
    expect(brandStoryContentSchema.parse(valid)).toEqual(valid)
  })

  test('testimonialsContentSchema validates array', () => {
    const valid = { heading: "Reviews", testimonials: [{ name: "Alice", text: "Great", rating: 5 }] }
    expect(testimonialsContentSchema.parse(valid)).toEqual(valid)
  })

  test('newsletterContentSchema validates', () => {
    const valid = { heading: "News", subheading: "Sub", placeholder: "Email", buttonText: "Sub" }
    expect(newsletterContentSchema.parse(valid)).toEqual(valid)
  })

  test('faqContentSchema validates array', () => {
    const valid = { heading: "FAQ", questions: [{ question: "Q?", answer: "A!" }] }
    expect(faqContentSchema.parse(valid)).toEqual(valid)
  })

  test('footerContentSchema validates nested social links', () => {
    const valid = { storeDescription: "Desc", storeAddress: "Addr", copyrightText: "C", socialLinks: { facebook: "fb", instagram: "ig" } }
    expect(footerContentSchema.parse(valid)).toEqual({ ...valid, showPaymentBadges: true })
  })

  test('storefrontSectionInputSchema validates full section wrapper', () => {
    const valid = { sectionKey: "hero", content: { title: "Title" }, sortOrder: 1, isVisible: true }
    expect(storefrontSectionInputSchema.parse(valid)).toEqual(valid)
  })
})
