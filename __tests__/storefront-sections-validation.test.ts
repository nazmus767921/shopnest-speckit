import { describe, it, expect } from "vitest"
import { faqContentSchema, footerContentSchema } from "@/lib/validations/storefront-sections"

describe("Storefront Sections Zod Validation", () => {
  describe("faqContentSchema", () => {
    it("should allow valid faq content", () => {
      const data = {
        heading: "Frequently Asked Questions",
        questions: [
          { question: "Q1?", answer: "A1." },
          { question: "Q2?", answer: "A2." },
        ]
      }
      const result = faqContentSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("should allow empty questions array", () => {
      const data = { questions: [] }
      const result = faqContentSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("should reject invalid question objects", () => {
      const data = {
        questions: [
          { question: "", answer: "A1." } // Empty question
        ]
      }
      const result = faqContentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should reject missing answer", () => {
      const data = {
        questions: [
          { question: "Q1?" }
        ]
      }
      const result = faqContentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe("footerContentSchema", () => {
    it("should allow valid footer content", () => {
      const data = {
        storeDescription: "My store",
        storeAddress: "123 Street",
        socialLinks: { facebook: "url" },
        showPaymentBadges: true,
        copyrightText: "© 2026",
      }
      const result = footerContentSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("should default showPaymentBadges to true", () => {
      const data = {}
      const result = footerContentSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.showPaymentBadges).toBe(true)
      }
    })

    it("should reject invalid types", () => {
      const data = {
        storeAddress: 123 // Should be string
      }
      const result = footerContentSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})
