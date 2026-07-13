import { describe, it, expect, vi, beforeEach } from "vitest"
import { createProductAction, updateProductAction } from "../products"
import { auth } from "@/lib/auth/auth"
import { db } from "@/db"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import * as assertPlanModule from "@/lib/plans/assertPlan"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}))

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock("@/db/queries/merchants", () => ({
  getMerchantByOwnerId: vi.fn(),
}))

vi.mock("@/db/queries/products", () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  getProductById: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Product Actions - Image Limits", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user_1" } as any,
      session: { id: "sess_1", expiresAt: new Date(), ipAddress: null, userAgent: null, userId: "user_1", token: "xyz", createdAt: new Date(), updatedAt: new Date(), impersonatedBy: null },
    })
    vi.mocked(getMerchantByOwnerId).mockResolvedValue({
      id: "merchant_1",
      name: "Test Merchant",
      subdomain: "test",
      ownerId: "user_1",
      plan: "starter",
      subscriptionStatus: "active",
      trialExpiry: new Date(),
      bkashNumber: null,
      nagadNumber: null,
      phoneNumber: null,
      lowStockThresholdDefault: 5,
      telegramChatId: null,
      codEnabled: false,
      payDeliveryChargeFirst: false,
      bkashWalletNumber: null,
      nagadWalletNumber: null,
      template: "general",
      themeSettings: null,
    })
  })

  it("fails to create product if image limit is exceeded", async () => {
    const images = Array.from({ length: 15 }, (_, i) => `image_${i}.jpg`)
    
    // We expect the original assertPlanLimit to throw because we are exceeding limits, 
    // wait, we aren't mocking assertPlanLimit so it will run real logic or we can mock it?
    // Let's actually spy on assertPlanLimit and force it to throw as it would in real life,
    // or let the real implementation run. The real implementation uses getPlanLimits.
    // getPlanLimits will return the limits for "starter" plan which is 5.
    
    const payload = {
      id: "prod_1",
      name: "Test Product",
      description: "Desc",
      price: 100,
      stockCount: 10,
      lowStockThreshold: 2,
      isPublished: true,
      images,
      categoryId: null,
      promotionTypes: [],
    }

    const result = await createProductAction(payload)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain("Your plan allows a maximum of 5 product gallery images")
    }
  })

  it("fails to update product if image limit is exceeded", async () => {
    const images = Array.from({ length: 6 }, (_, i) => `image_${i}.jpg`)
    
    const payload = {
      name: "Updated Product",
      description: "Desc",
      price: 150,
      stockCount: 15,
      lowStockThreshold: 3,
      isPublished: true,
      images,
      categoryId: null,
      promotionTypes: [],
    }

    const result = await updateProductAction("prod_1", payload)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain("Your plan allows a maximum of 5 product gallery images")
    }
  })
})
