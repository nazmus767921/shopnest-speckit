import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindMany, mockFindFirst } = vi.hoisted(() => {
  const mockFindMany = vi.fn()
  const mockFindFirst = vi.fn()
  return { mockFindMany, mockFindFirst }
})

vi.mock("@/db", () => ({
  db: {
    query: {
      storeTemplates: {
        findMany: mockFindMany,
        findFirst: mockFindFirst,
      },
    },
  },
}))

import {
  getActiveTemplates,
  getTemplatesForTier,
  getTemplateBySlug,
  resolveTemplateForBusinessType,
} from "../templates"

const mockTemplatesData = [
  {
    id: "general",
    slug: "general",
    name: "General Store",
    businessTypes: ["general", "electronics", "beauty", "food"],
    allowedTiers: ["starter", "growth", "pro"],
    isActive: true,
    isDefault: true,
    sortOrder: 0,
  },
  {
    id: "fashion",
    slug: "fashion",
    name: "Fashion Boutique",
    businessTypes: ["clothing", "accessories", "shoes"],
    allowedTiers: ["growth", "pro"],
    isActive: true,
    isDefault: false,
    sortOrder: 1,
  },
  {
    id: "premium-electronics",
    slug: "premium-electronics",
    name: "Premium Electronics",
    businessTypes: ["electronics"],
    allowedTiers: ["pro"],
    isActive: true,
    isDefault: false,
    sortOrder: 2,
  },
  {
    id: "draft-template",
    slug: "draft-template",
    name: "Draft Template",
    businessTypes: ["general"],
    allowedTiers: ["pro"],
    isActive: false,
    isDefault: false,
    sortOrder: 3,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Template DB Queries", () => {
  describe("getActiveTemplates", () => {
    it("should fetch and return active templates only", async () => {
      const activeOnly = mockTemplatesData.filter((t) => t.isActive)
      mockFindMany.mockResolvedValueOnce(activeOnly)

      const result = await getActiveTemplates()

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          orderBy: expect.any(Array),
        })
      )
      expect(result).toHaveLength(3)
      expect(result.some((t) => t.id === "draft-template")).toBe(false)
    })
  })

  describe("getTemplatesForTier", () => {
    it("should filter active templates by subscription tier", async () => {
      const activeOnly = mockTemplatesData.filter((t) => t.isActive)
      mockFindMany.mockResolvedValueOnce(activeOnly)

      // starter tier should only get general
      const starterTemplates = await getTemplatesForTier("starter")
      expect(starterTemplates).toHaveLength(1)
      expect(starterTemplates[0].id).toBe("general")

      mockFindMany.mockResolvedValueOnce(activeOnly)

      // growth tier should get general and fashion
      const growthTemplates = await getTemplatesForTier("growth")
      expect(growthTemplates).toHaveLength(2)
      expect(growthTemplates.map((t) => t.id)).toEqual(["general", "fashion"])

      mockFindMany.mockResolvedValueOnce(activeOnly)

      // pro tier should get all three active templates
      const proTemplates = await getTemplatesForTier("pro")
      expect(proTemplates).toHaveLength(3)
      expect(proTemplates.map((t) => t.id)).toEqual(["general", "fashion", "premium-electronics"])
    })
  })

  describe("getTemplateBySlug", () => {
    it("should retrieve a single template by slug", async () => {
      const fashionTemplate = mockTemplatesData[1]
      mockFindFirst.mockResolvedValueOnce(fashionTemplate)

      const result = await getTemplateBySlug("fashion")

      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
        })
      )
      expect(result).toEqual(fashionTemplate)
    })
  })

  describe("resolveTemplateForBusinessType", () => {
    it("should resolve template matching business type and tier", async () => {
      const activeOnly = mockTemplatesData.filter((t) => t.isActive)
      mockFindMany.mockResolvedValueOnce(activeOnly)

      // clothing + growth -> fashion template
      const res = await resolveTemplateForBusinessType("clothing", "growth")
      expect(res?.id).toBe("fashion")
    })

    it("should fall back to default template if business type matches but tier is not allowed", async () => {
      const activeOnly = mockTemplatesData.filter((t) => t.isActive)
      mockFindMany.mockResolvedValueOnce(activeOnly)

      // electronics + starter -> premium-electronics matches type but not tier. Fallback to default (general).
      const res = await resolveTemplateForBusinessType("electronics", "starter")
      expect(res?.id).toBe("general")
    })

    it("should fall back to default template if business type has no matching template", async () => {
      const activeOnly = mockTemplatesData.filter((t) => t.isActive)
      mockFindMany.mockResolvedValueOnce(activeOnly)

      // unknown_type + pro -> fallback to default (general)
      const res = await resolveTemplateForBusinessType("unknown_type", "pro")
      expect(res?.id).toBe("general")
    })
  })
})
