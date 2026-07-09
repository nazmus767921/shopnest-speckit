import { describe, it, expect } from "vitest"
import { getTemplate } from "../registry"

describe("Template Registry", () => {
  it("should resolve 'general' to the general template module", () => {
    const template = getTemplate("general")
    expect(template).toBeDefined()
    expect(template.HomePage).toBeDefined()
    expect(template.PLP).toBeDefined()
    expect(template.PDP).toBeDefined()
    expect(template.CartPage).toBeDefined()
    expect(template.Navbar).toBeDefined()
    expect(template.Footer).toBeDefined()
  })

  it("should resolve 'fashion' to the fashion template module", () => {
    const template = getTemplate("fashion")
    expect(template).toBeDefined()
    expect(template.HomePage).toBeDefined()
    expect(template.PLP).toBeDefined()
    expect(template.PDP).toBeDefined()
    expect(template.CartPage).toBeDefined()
    expect(template.Navbar).toBeDefined()
    expect(template.Footer).toBeDefined()
  })

  it("should fall back to general template for an unknown slug", () => {
    const template = getTemplate("unknown-template-slug")
    const generalTemplate = getTemplate("general")
    expect(template).toBe(generalTemplate)
  })
})
