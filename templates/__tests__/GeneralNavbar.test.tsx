/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import { GeneralNavbar } from "../general/GeneralNavbar"
import { StoreData, Category } from "../types"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}))

const mockStore: StoreData = {
  id: "store-1",
  name: "Test Store",
  subdomain: "test",
  template: "general",
}

const mockCategories: any[] = [
  { id: "cat-1", name: "Electronics", slug: "electronics", description: null, parentId: null },
  { id: "cat-2", name: "Laptops", slug: "laptops", description: null, parentId: "cat-1" },
  { id: "cat-3", name: "Phones", slug: "phones", description: null, parentId: "cat-1" },
]

const mockMenu = {
  id: "menu-1",
  items: [
    {
      id: "item-1",
      label: "Tech Gear",
      type: "category",
      category: { id: "cat-1", slug: "electronics" },
      position: 0,
    }
  ]
}

test("GeneralNavbar dynamically injects subcategories as children for category links", () => {
  render(
    <GeneralNavbar
      store={mockStore}
      subdomain="test"
      menu={mockMenu}
      categories={mockCategories}
    />
  )

  // Top level menu item should render
  expect(screen.getByText("Tech Gear")).toBeDefined()

  // Auto-injected subcategories should render inside the dropdown
  expect(screen.getByText("Laptops")).toBeDefined()
  expect(screen.getByText("Phones")).toBeDefined()
})
