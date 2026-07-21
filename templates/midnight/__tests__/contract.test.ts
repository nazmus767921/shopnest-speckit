import { describe, it, expect } from "vitest"
import { midnightTemplate } from "../index"

describe("Midnight Template Contract", () => {
  it("implements all required sections", () => {
    expect(midnightTemplate.sections.hero).toBeDefined()
    expect(midnightTemplate.sections.featured_products).toBeDefined()
    expect(midnightTemplate.sections.category_showcase).toBeDefined()
    expect(midnightTemplate.sections.promo_banner).toBeDefined()
    expect(midnightTemplate.sections.brand_story).toBeDefined()
    expect(midnightTemplate.sections.testimonials).toBeDefined()
    expect(midnightTemplate.sections.newsletter).toBeDefined()
    expect(midnightTemplate.sections.faq).toBeDefined()
    expect(midnightTemplate.sections.announcement_bar).toBeDefined()
    expect(midnightTemplate.sections.footer).toBeDefined()
  })

  it("implements all required pages", () => {
    expect(midnightTemplate.pages.home).toBeDefined()
    expect(midnightTemplate.pages.plp).toBeDefined()
    expect(midnightTemplate.pages.pdp).toBeDefined()
    expect(midnightTemplate.pages.standard).toBeDefined()
  })
})
