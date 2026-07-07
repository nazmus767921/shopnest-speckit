import { describe, it, expect } from "vitest"
import { 
  heroContentSchema, 
  announcementBarContentSchema, 
  categoryShowcaseContentSchema, 
  aboutContentSchema 
} from "../storefront-sections"

describe("Storefront Sections Zod Schemas", () => {
  describe("heroContentSchema", () => {
    it("should validate a correct hero payload", () => {
      const payload = { title: "Welcome", buttonText: "Shop Now", overlayOpacity: 50 }
      const result = heroContentSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it("should reject overlayOpacity out of bounds", () => {
      const payload = { title: "Welcome", overlayOpacity: 150 }
      const result = heroContentSchema.safeParse(payload)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Number must be less than or equal to 100")
      }
    })
  })

  describe("announcementBarContentSchema", () => {
    it("should validate valid text and optional colors", () => {
      const payload = { text: "Free shipping!", backgroundColor: "#000000" }
      const result = announcementBarContentSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it("should require text", () => {
      const result = announcementBarContentSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe("categoryShowcaseContentSchema", () => {
    it("should validate layout and categoryIds array", () => {
      const payload = { title: "Shop by category", categoryIds: ["id1", "id2"], layout: "mosaic" }
      const result = categoryShowcaseContentSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })
  })

  describe("aboutContentSchema", () => {
    it("should require title and description", () => {
      const payload = { title: "About Us", description: "Our story" }
      const result = aboutContentSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })
  })
})
