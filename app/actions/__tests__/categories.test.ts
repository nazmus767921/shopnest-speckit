import { describe, it, expect, vi, beforeEach } from "vitest"
import { createCategoryAction, updateCategoryAction } from "../categories"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getCategoryById, createCategory, updateCategory } from "@/db/queries/categories"

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

vi.mock("@/db/queries/categories", () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  getCategoryById: vi.fn(),
}))

vi.mock("@/lib/cache/categories", () => ({
  getCachedCategories: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

describe("Category Actions - Hierarchy Limits", () => {
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

  it("fails to create a category if the selected parent is already a subcategory", async () => {
    // Mock getCategoryById to return a parent that itself has a parentId
    vi.mocked(getCategoryById).mockResolvedValue({
      id: "parent_cat",
      merchantId: "merchant_1",
      name: "Child Cat",
      slug: "child-cat",
      parentId: "grandparent_cat", // this means it's already a subcategory
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    const payload = {
      name: "Grandchild Cat",
      slug: "grandchild",
      parentId: "parent_cat",
    }

    const result = await createCategoryAction(payload)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain("Maximum category depth exceeded. A subcategory cannot have its own subcategories.")
    }
  })

  it("fails to update a category to have a parent if that parent is a subcategory", async () => {
    vi.mocked(getCategoryById).mockResolvedValue({
      id: "parent_cat",
      merchantId: "merchant_1",
      name: "Child Cat",
      slug: "child-cat",
      parentId: "grandparent_cat", 
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    const payload = {
      name: "Updated Cat",
      slug: "updated",
      parentId: "parent_cat",
    }

    const result = await updateCategoryAction("some_cat_id", payload)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain("Maximum category depth exceeded. A subcategory cannot have its own subcategories.")
    }
  })

  it("fails to update a category to have itself as a parent", async () => {
    const payload = {
      name: "Self Parent",
      slug: "self-parent",
      parentId: "cat_1",
    }
    const result = await updateCategoryAction("cat_1", payload)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain("A category cannot be its own parent.")
    }
  })
})
