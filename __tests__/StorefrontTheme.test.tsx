import { describe, it, expect, vi, beforeEach } from "vitest"
import { storefrontLayoutSchema } from "@/lib/validations/storefront"

// Mock auth & next/headers
vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

const { mockCookies } = vi.hoisted(() => {
  return {
    mockCookies: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    }
  }
})

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => mockCookies),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// Mock plan getter
const { mockGetMerchantPlan } = vi.hoisted(() => {
  return { mockGetMerchantPlan: vi.fn() }
})
vi.mock("@/lib/plans/getPlan", () => ({
  getMerchantPlan: mockGetMerchantPlan,
}))

// Mock DB queries for merchants
const { mockGetMerchantByOwnerId, mockUpdateStorefrontLayout } = vi.hoisted(() => {
  return {
    mockGetMerchantByOwnerId: vi.fn(),
    mockUpdateStorefrontLayout: vi.fn(),
  }
})

vi.mock("@/db/queries/merchants", async () => {
  const actual = await vi.importActual<any>("@/db/queries/merchants")
  return {
    ...actual,
    getMerchantByOwnerId: mockGetMerchantByOwnerId,
    updateStorefrontLayout: mockUpdateStorefrontLayout,
  }
})

import { updateStorefrontLayoutAction } from "@/app/actions/settings"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Storefront Template Validation & Plan Enforcement", () => {
  it("should validate storefrontLayoutSchema with template field", () => {
    // Valid general template
    const resDefault = storefrontLayoutSchema.safeParse({
      template: "general",
    })
    expect(resDefault.success).toBe(true)

    // Valid fashion template
    const resFashion = storefrontLayoutSchema.safeParse({
      template: "fashion",
    })
    expect(resFashion.success).toBe(true)

    // Invalid template value
    const resInvalid = storefrontLayoutSchema.safeParse({
      template: "invalid-template-name",
    })
    expect(resInvalid.success).toBe(false)
  })

  it("should fail to save premium 'fashion' template if merchant is on starter plan", async () => {
    const { auth } = await import("@/lib/auth/auth")

    // Setup session
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-123", email: "user@example.com", name: "User" },
      expiresAt: new Date(Date.now() + 10000),
    } as any)

    // Setup merchant
    mockGetMerchantByOwnerId.mockResolvedValueOnce({
      id: "merchant-123",
      ownerId: "user-123",
      plan: "starter",
    })

    // Setup plan without fashion template access (starter slug)
    mockGetMerchantPlan.mockResolvedValueOnce({
      name: "Starter",
      slug: "starter",
      pricePaisa: 0,
      features: {
        max_products: 50,
      },
    })

    const payload = {
      template: "fashion",
      subtitle: "My boutique shop",
    }

    const response = await updateStorefrontLayoutAction(payload)
    expect(response.success).toBe(false)
    expect(response.error).toContain("Upgrade your subscription to use premium templates")
  })

  it("should successfully save 'fashion' template if merchant is on growth plan", async () => {
    const { auth } = await import("@/lib/auth/auth")

    // Setup session
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-123", email: "user@example.com", name: "User" },
      expiresAt: new Date(Date.now() + 10000),
    } as any)

    // Setup merchant
    mockGetMerchantByOwnerId.mockResolvedValueOnce({
      id: "merchant-123",
      ownerId: "user-123",
      plan: "growth",
    })

    // Setup plan supporting fashion template (growth slug)
    mockGetMerchantPlan.mockResolvedValueOnce({
      name: "Growth",
      slug: "growth",
      pricePaisa: 99900,
      features: {
        max_products: 500,
      },
    })

    mockUpdateStorefrontLayout.mockResolvedValueOnce({
      id: "merchant-123",
      template: "fashion",
    })

    const payload = {
      template: "fashion",
      subtitle: "My premium boutique shop",
    }

    const response = await updateStorefrontLayoutAction(payload)
    expect(response.success).toBe(true)
    expect(mockUpdateStorefrontLayout).toHaveBeenCalledWith("merchant-123", expect.objectContaining({
      template: "fashion",
    }))
  })
})
