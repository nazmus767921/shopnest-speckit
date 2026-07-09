import { describe, it, expect, vi, beforeEach } from "vitest"
import { getStorefrontSections } from "@/db/queries/storefront-sections"

// Mock the database query
const mockFindMany = vi.fn()
vi.mock("@/db", () => ({
  db: {
    query: {
      storefrontSections: {
        findMany: (...args: any[]) => mockFindMany(...args)
      }
    }
  }
}))

describe("storefront-sections queries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getStorefrontSections", () => {
    it("should return sections ordered by sortOrder, meaning footer is last", async () => {
      // Mock db response to simulate what the database would return after an ORDER BY sortOrder ASC
      mockFindMany.mockResolvedValue([
        { sectionKey: "announcement_bar", sortOrder: 0 },
        { sectionKey: "hero", sortOrder: 1 },
        { sectionKey: "faq", sortOrder: 2 },
        { sectionKey: "footer", sortOrder: 9999 }
      ])

      const sections = await getStorefrontSections("merchant-123")
      
      expect(sections).toHaveLength(4)
      
      // Verify footer is the absolute last element
      const lastSection = sections[sections.length - 1]
      expect(lastSection.sectionKey).toBe("footer")
      
      // Verify the query was called with the correct sorting logic
      expect(mockFindMany).toHaveBeenCalledTimes(1)
      const callArgs = mockFindMany.mock.calls[0][0]
      expect(callArgs).toHaveProperty("orderBy")
    })
  })
})
