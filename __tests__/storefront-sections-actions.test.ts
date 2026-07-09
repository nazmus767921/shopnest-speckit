import { describe, it, expect, vi, beforeEach } from "vitest"
import { seedDefaultSectionsAction, saveStorefrontSectionsAction } from "@/app/actions/storefront-sections"

const mockGetSession = vi.fn()
vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: (...args: any[]) => mockGetSession(...args)
    }
  }
}))

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Map())
}))

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn()
}))

const mockGetMerchantByOwnerId = vi.fn()
vi.mock("@/db/queries/merchants", () => ({
  getMerchantByOwnerId: (...args: any[]) => mockGetMerchantByOwnerId(...args)
}))

const mockGetStorefrontSections = vi.fn()
const mockSaveStorefrontSections = vi.fn()
vi.mock("@/db/queries/storefront-sections", () => ({
  getStorefrontSections: (...args: any[]) => mockGetStorefrontSections(...args),
  saveStorefrontSections: (...args: any[]) => mockSaveStorefrontSections(...args)
}))

describe("storefront-sections server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("seedDefaultSectionsAction", () => {
    it("should fail if unauthorized", async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await seedDefaultSectionsAction()
      expect(res).toEqual({ success: false, error: "Unauthorized" })
    })

    it("should not seed if sections already exist", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-1" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-1", subdomain: "test" })
      mockGetStorefrontSections.mockResolvedValue([{ id: "sec-1" }]) // Exists
      
      const res = await seedDefaultSectionsAction()
      expect(res).toEqual({ success: true, seeded: false })
      expect(mockSaveStorefrontSections).not.toHaveBeenCalled()
    })

    it("should seed sections including faq and footer if none exist", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-1" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-1", subdomain: "test" })
      mockGetStorefrontSections.mockResolvedValue([]) // Empty
      
      const res = await seedDefaultSectionsAction()
      expect(res).toEqual({ success: true, seeded: true })
      
      expect(mockSaveStorefrontSections).toHaveBeenCalledWith("merchant-1", expect.arrayContaining([
        expect.objectContaining({ sectionKey: "faq" }),
        expect.objectContaining({ sectionKey: "footer", sortOrder: 9999 })
      ]))
    })
  })
})
