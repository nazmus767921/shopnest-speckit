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

describe("Storefront Theme Validation & Plan Enforcement", () => {
  it("should validate storefrontLayoutSchema with theme field", () => {
    // Valid default theme
    const resDefault = storefrontLayoutSchema.safeParse({
      theme: "default",
    })
    expect(resDefault.success).toBe(true)

    // Valid cinematic theme
    const resCinematic = storefrontLayoutSchema.safeParse({
      theme: "cinematic",
    })
    expect(resCinematic.success).toBe(true)

    // Invalid theme value
    const resInvalid = storefrontLayoutSchema.safeParse({
      theme: "invalid-theme-name",
    })
    expect(resInvalid.success).toBe(false)
  })

  it("should fail to save premium 'cinematic' theme if merchant is on starter plan", async () => {
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

    // Setup plan without cinematic theme access (starter slug)
    mockGetMerchantPlan.mockResolvedValueOnce({
      name: "Starter",
      slug: "starter",
      pricePaisa: 0,
      features: {
        max_products: 50,
      },
    })

    const payload = {
      theme: "cinematic",
      subtitle: "My boutique shop",
    }

    const response = await updateStorefrontLayoutAction(payload)
    expect(response.success).toBe(false)
    expect(response.error).toContain("Upgrade your subscription to use premium themes")
  })

  it("should successfully save 'cinematic' theme if merchant is on growth plan", async () => {
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

    // Setup plan supporting cinematic theme (growth slug)
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
      theme: "cinematic",
    })

    const payload = {
      theme: "cinematic",
      subtitle: "My premium boutique shop",
    }

    const response = await updateStorefrontLayoutAction(payload)
    expect(response.success).toBe(true)
    expect(mockUpdateStorefrontLayout).toHaveBeenCalledWith("merchant-123", expect.objectContaining({
      theme: "cinematic",
    }))
  })
})
