import { describe, it, expect, vi, beforeEach } from "vitest"
import { createFlashSaleAction, updateFlashSaleAction } from "@/app/actions/flash-sales"

// Mock the dependencies
const mockGetSession = vi.fn()
const mockGetMerchantByOwnerId = vi.fn()
const mockCreateFlashSale = vi.fn()
const mockUpdateFlashSale = vi.fn()

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: () => mockGetSession(),
    },
  },
}))

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([{ stockCount: 100 }])
      })
    }),
    query: {
      flashSales: {
        findFirst: () => Promise.resolve({
          id: "sale-123",
          productId: "00000000-0000-0000-0000-000000000000",
          variantId: null,
          limitQuantity: 10,
        })
      }
    }
  }
}))

vi.mock("@/db/queries/merchants", () => ({
  getMerchantByOwnerId: (id: string) => mockGetMerchantByOwnerId(id),
}))

vi.mock("@/db/queries/flash-sales", () => ({
  createFlashSale: (merchantId: string, data: any) => mockCreateFlashSale(merchantId, data),
  updateFlashSale: (merchantId: string, id: string, data: any) => mockUpdateFlashSale(merchantId, id, data),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve({ get: () => "mock-header" }),
}))

describe("Flash Sales Admin Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createFlashSaleAction", () => {
    it("should fail validation if start time is in the past", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })

      const pastDate = new Date(Date.now() - 3600 * 1000).toISOString() // 1 hour ago
      const endDate = new Date(Date.now() + 3600 * 1000).toISOString()

      const res = await createFlashSaleAction({
        productId: "00000000-0000-0000-0000-000000000000",
        salePricePaisa: 15000,
        limitQuantity: 10,
        startTime: pastDate,
        endTime: endDate,
      })

      expect(res.success).toBe(false)
      expect(res.error).toContain("future")
    })

    it("should succeed with valid arguments", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })
      mockCreateFlashSale.mockResolvedValue({ id: "sale-123" })

      const startDate = new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour future
      const endDate = new Date(Date.now() + 7200 * 1000).toISOString()

      const res = await createFlashSaleAction({
        productId: "00000000-0000-0000-0000-000000000000",
        salePricePaisa: 15000,
        limitQuantity: 10,
        startTime: startDate,
        endTime: endDate,
      })

      expect(res.success).toBe(true)
      expect(mockCreateFlashSale).toHaveBeenCalled()
    })
  })
})
