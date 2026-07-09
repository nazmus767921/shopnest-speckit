import { describe, it, expect, vi } from "vitest"
import { getNewArrivals, getFeaturedProducts } from "@/lib/products/data"

vi.mock("next/dist/server/use-cache/cache-life", () => ({
  cacheLife: vi.fn(),
}))

vi.mock("next/dist/server/use-cache/cache-tag", () => ({
  cacheTag: vi.fn(),
}))

vi.mock("@/db", () => ({
  db: {
    query: {
      products: {
        findMany: vi.fn().mockResolvedValue([]),
      }
    }
  }
}))

describe("Homepage Sections Data Fetching", () => {
  it("should fetch new arrivals", async () => {
    // We expect this to fail initially if getNewArrivals is not implemented
    const result = await getNewArrivals("merchant-1", 4)
    expect(Array.isArray(result)).toBe(true)
  })

  it("should fetch featured products", async () => {
    const result = await getFeaturedProducts("merchant-1", 4)
    expect(Array.isArray(result)).toBe(true)
  })
})
