import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { SectionRenderer } from "@/components/storefront/sections/SectionRenderer"

describe("Storefront Rendering", () => {
  it("renders only visible sections based on sortOrder", () => {
    const sections = [
      {
        id: "1",
        merchantId: "m1",
        sectionKey: "hero",
        content: { title: "Test Hero" },
        sortOrder: 2,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        merchantId: "m1",
        sectionKey: "faq",
        content: { heading: "Test FAQ", items: [{ question: "Q1", answer: "A1" }] },
        sortOrder: 1,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        merchantId: "m1",
        sectionKey: "about",
        content: { title: "Test About", description: "Desc" },
        sortOrder: 3,
        isVisible: false, // hidden
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]

    const { container } = render(
      <SectionRenderer sections={sections} merchantId="m1" subdomain="test" />
    )

    // FAQ should render (sortOrder 1)
    expect(container.textContent).toContain("Test FAQ")
    expect(container.textContent).toContain("Q1")
    expect(container.textContent).toContain("A1")

    // Hero should render (sortOrder 2)
    expect(container.textContent).toContain("Test Hero")

    // About should NOT render (isVisible false)
    expect(container.textContent).not.toContain("Test About")

    // The order of elements in the DOM should match sortOrder (FAQ before Hero)
    const html = container.innerHTML
    const faqIndex = html.indexOf("Test FAQ")
    const heroIndex = html.indexOf("Test Hero")
    expect(faqIndex).toBeLessThan(heroIndex)
  })
})
