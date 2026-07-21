import { describe, it, expect } from "vitest"
import { sunsetTemplate } from "../index"

describe("Sunset Template Contract", () => {
  it("implements all required sections", () => {
    expect(sunsetTemplate.sections.hero).toBeDefined()
    expect(sunsetTemplate.sections.featured_products).toBeDefined()
    expect(sunsetTemplate.sections.category_showcase).toBeDefined()
    expect(sunsetTemplate.sections.promo_banner).toBeDefined()
    expect(sunsetTemplate.sections.brand_story).toBeDefined()
    expect(sunsetTemplate.sections.testimonials).toBeDefined()
    expect(sunsetTemplate.sections.newsletter).toBeDefined()
    expect(sunsetTemplate.sections.faq).toBeDefined()
    expect(sunsetTemplate.sections.announcement_bar).toBeDefined()
    expect(sunsetTemplate.sections.footer).toBeDefined()
  })

  it("implements all required pages", () => {
    expect(sunsetTemplate.pages.home).toBeDefined()
    expect(sunsetTemplate.pages.plp).toBeDefined()
    expect(sunsetTemplate.pages.pdp).toBeDefined()
    expect(sunsetTemplate.pages.standard).toBeDefined()
  })
})
