import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { RetailHomePage } from "@/templates/retail/RetailHomePage"

// Mock the CSS file
vi.mock("../templates/retail/styles.css", () => ({}))

// Mock connection utility
vi.mock("next/server", () => ({
  connection: () => Promise.resolve(),
}))

// Mock dynamic subcomponents to avoid rendering external dependencies
vi.mock("@/components/storefront/sections/SectionRenderer", () => ({
  SectionRenderer: () => <div data-testid="section-renderer" />,
}))

vi.mock("@/lib/cache/categories", () => ({
  getCachedCategories: () => Promise.resolve([
    { id: "cat-1", name: "Shirts", slug: "shirts", parentId: null, imageUrl: null },
  ]),
}))

vi.mock("@/lib/cache/products", () => ({
  getCachedPublishedProducts: () => Promise.resolve([
    { id: "prod-1", name: "Premium Blue Jeans", pricePaisa: 250000, slug: "blue-jeans", images: [] },
  ]),
}))

vi.mock("@/db", () => ({
  db: {
    query: {
      flashSales: {
        findMany: () => Promise.resolve([]),
      },
    },
  },
}))

describe("Retail Storefront Template Landing Page", () => {
  it("renders recommended products title correctly", async () => {
    const store = {
      id: "merchant-123",
      name: "BeliBeli Store",
      subdomain: "belibeli",
      template: "retail",
    }

    // Since RetailHomePage is an async Server Component, we resolve it first
    const PageElement = await RetailHomePage({ store, sections: [] })
    render(PageElement)

    expect(screen.getByText(/Recommended Products/i)).toBeDefined()
  })
})
