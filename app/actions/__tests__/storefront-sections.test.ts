import { describe, it, expect, vi, beforeEach } from "vitest"
import { saveStorefrontSectionsAction, seedDefaultSectionsAction } from "../storefront-sections"

const mockGetSession = vi.fn()
vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: (...args: any[]) => mockGetSession(...args),
    },
  },
}))

const mockGetMerchantByOwnerId = vi.fn()
vi.mock("@/db/queries/merchants", () => ({
  getMerchantByOwnerId: (...args: any[]) => mockGetMerchantByOwnerId(...args),
}))

const mockSaveStorefrontSections = vi.fn()
const mockGetStorefrontSections = vi.fn()
vi.mock("@/db/queries/storefront-sections", () => ({
  saveStorefrontSections: (...args: any[]) => mockSaveStorefrontSections(...args),
  getStorefrontSections: (...args: any[]) => mockGetStorefrontSections(...args),
}))

vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}))

const mockRevalidateTag = vi.fn()
vi.mock("next/cache", () => ({
  revalidateTag: (...args: any[]) => mockRevalidateTag(...args),
}))

describe("Storefront Sections Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ user: { id: "user-123", email: "test@example.com" } })
    mockGetMerchantByOwnerId.mockResolvedValue({ id: "merch-123", subdomain: "test" })
  })

  describe("saveStorefrontSectionsAction", () => {
    it("should save valid sections and revalidate tag", async () => {
      const sections = [
        { sectionKey: "hero", content: { title: "Test" }, sortOrder: 0, isVisible: true }
      ]
      
      const res = await saveStorefrontSectionsAction(sections)
      
      expect(res.success).toBe(true)
      expect(mockSaveStorefrontSections).toHaveBeenCalledWith("merch-123", sections)
      expect(mockRevalidateTag).toHaveBeenCalledWith("storefront-sections-test", "max")
    })

    it("should fail if unauthenticated", async () => {
      mockGetSession.mockResolvedValueOnce(null)
      const res = await saveStorefrontSectionsAction([])
      expect(res.success).toBe(false)
      expect(res.error).toBe("Unauthorized")
      expect(mockSaveStorefrontSections).not.toHaveBeenCalled()
    })

    it("should fail validation on invalid payload", async () => {
      const invalidSections = [
        { sectionKey: "", content: {}, sortOrder: "invalid", isVisible: true }
      ] as any
      
      const res = await saveStorefrontSectionsAction(invalidSections)
      
      expect(res.success).toBe(false)
      expect(res.error).toContain("Validation error")
      expect(mockSaveStorefrontSections).not.toHaveBeenCalled()
    })
  })

  describe("seedDefaultSectionsAction", () => {
    it("should do nothing if sections already exist", async () => {
      mockGetStorefrontSections.mockResolvedValueOnce([
        { id: "1" }
      ])

      const res = await seedDefaultSectionsAction()

      expect(res.success).toBe(true)
      expect(res.seeded).toBe(false)
      expect(mockSaveStorefrontSections).not.toHaveBeenCalled()
    })

    it("should seed default sections if none exist", async () => {
      mockGetStorefrontSections.mockResolvedValueOnce([])

      const res = await seedDefaultSectionsAction()

      expect(res.success).toBe(true)
      expect(res.seeded).toBe(true)
      expect(mockSaveStorefrontSections).toHaveBeenCalledWith(
        "merch-123",
        expect.arrayContaining([
          expect.objectContaining({ sectionKey: "hero" })
        ])
      )
    })
  })
})
