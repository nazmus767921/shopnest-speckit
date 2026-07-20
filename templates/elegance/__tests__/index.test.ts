import { expect, test, describe } from "vitest"
import * as elegance from "../index"

describe("Elegance Template Module", () => {
  test("exports required page components", () => {
    expect(elegance.HomePage).toBeDefined()
    expect(elegance.PLP).toBeDefined()
    expect(elegance.PDP).toBeDefined()
    expect(elegance.CartPage).toBeDefined()
    expect(elegance.Navbar).toBeDefined()
    expect(elegance.StandardPage).toBeDefined()
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
