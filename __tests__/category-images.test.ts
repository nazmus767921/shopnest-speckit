import { describe, it, expect, vi, beforeEach } from "vitest"
import { createCategoryAction, updateCategoryAction } from "@/app/actions/categories"

// Mock the dependencies
const mockGetSession = vi.fn()
const mockGetMerchantByOwnerId = vi.fn()
const mockCreateCategory = vi.fn()
const mockUpdateCategory = vi.fn()

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: () => mockGetSession(),
    },
  },
}))

vi.mock("@/db/queries/merchants", () => ({
  getMerchantByOwnerId: (id: string) => mockGetMerchantByOwnerId(id),
}))

vi.mock("@/db/queries/categories", () => ({
  createCategory: (merchantId: string, data: any) => mockCreateCategory(merchantId, data),
  updateCategory: (merchantId: string, categoryId: string, data: any) => mockUpdateCategory(merchantId, categoryId, data),
  getCategoryById: () => Promise.resolve({ id: "parent-123" }),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve({ get: () => "mock-header" }),
}))

describe("Category Images Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should validate and save category image_url in createCategoryAction", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
    mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })
    mockCreateCategory.mockResolvedValue({ id: "cat-123" })

    const res = await createCategoryAction({
      name: "Jackets",
      slug: "jackets",
      imageUrl: "/storage/v1/object/public/media/jacket.png",
    })

    expect(res.success).toBe(true)
    expect(mockCreateCategory).toHaveBeenCalledWith("merchant-123", expect.objectContaining({
      imageUrl: "/storage/v1/object/public/media/jacket.png",
    }))
  })

  it("should validate and save category image_url in updateCategoryAction", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
    mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })
    mockUpdateCategory.mockResolvedValue({ id: "cat-123" })

    const res = await updateCategoryAction("cat-123", {
      name: "Denim Jackets",
      slug: "denim-jackets",
      imageUrl: "/storage/v1/object/public/media/denim.png",
    })

    expect(res.success).toBe(true)
    expect(mockUpdateCategory).toHaveBeenCalledWith("merchant-123", "cat-123", expect.objectContaining({
      imageUrl: "/storage/v1/object/public/media/denim.png",
    }))
  })
})
