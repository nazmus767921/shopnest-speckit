import { describe, it, expect, vi } from "vitest"
import { getPageBySlug } from "@/db/queries/pages"

vi.mock("@/db", () => ({
  db: {
    query: {
      pages: {
        findFirst: vi.fn().mockResolvedValue(null),
      }
    }
  }
}))

describe("CMS Pages Data Fetching", () => {
  it("should fetch page by slug", async () => {
    // Should fail initially if getPageBySlug is not implemented
    const result = await getPageBySlug("merchant-1", "about-us")
    expect(result).toBeNull() // Since mock returns null
  })
})
