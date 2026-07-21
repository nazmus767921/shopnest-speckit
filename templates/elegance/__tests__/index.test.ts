import { expect, test, describe } from "vitest"
import { elegance } from "../index"

describe("Elegance Template Module", () => {
  test("exports required page components", () => {
    expect(elegance.pages.home).toBeDefined()
    expect(elegance.pages.plp).toBeDefined()
    expect(elegance.pages.pdp).toBeDefined()
    expect(elegance.pages.standard).toBeDefined()
  })

  test("exports template-specific sections", () => {
    expect(elegance.sections).toBeDefined()
    expect(elegance.sections.hero).toBeDefined()
    expect(elegance.sections.category_showcase).toBeDefined()
    expect(elegance.sections.featured_products).toBeDefined()
    expect(elegance.sections.promo_banner).toBeDefined()
    expect(elegance.sections.footer).toBeDefined()
  })
})
