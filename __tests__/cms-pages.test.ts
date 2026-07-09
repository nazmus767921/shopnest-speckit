import { describe, it, expect, vi } from "vitest"
import { getPageBySlug } from "@/db/queries/pages"
import { pageSchema } from "@/lib/validations/pages"

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
    const result = await getPageBySlug("merchant-1", "about-us")
    expect(result).toBeNull()
  })
})

describe("CMS Page Validation (pageSchema)", () => {
  it("should validate a correct page layout and content", () => {
    const validData = {
      title: "About Our Shop",
      slug: "about-us",
      content: "<p>Welcome to <strong>ShopNest</strong>! Here is our story.</p><ul><li>Quality</li><li>Speed</li></ul>",
      isPublished: true,
    }
    const result = pageSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("should reject invalid slugs containing uppercase or special characters", () => {
    const invalidData = {
      title: "About Our Shop",
      slug: "About-Us!",
      content: "<p>Plain text</p>",
      isPublished: true,
    }
    const result = pageSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Slug must only contain lowercase letters, numbers, and hyphens")
    }
  })

  it("should validate page content with links and HTML formatting", () => {
    const dataWithLinks = {
      title: "Terms of Service",
      slug: "terms",
      content: "<p>Please read our <a href=\"https://shopnest.com/terms\">terms</a> carefully.</p>",
      isPublished: false,
    }
    const result = pageSchema.safeParse(dataWithLinks)
    expect(result.success).toBe(true)
  })
})

