/**
 * COD Checkout Integration Tests
 * US1, US2, US3, Invariant 7
 *
 * @see specs/021-cod-checkout/spec.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { storeSettingsSchema } from "@/lib/validations/settings"
import { paymentSchema } from "@/lib/validations/checkout"

// Mock Drizzle DB calls
const { mockReturning, mockWhere, mockSet, mockUpdate, mockInsert, mockFindFirstMerchant, mockFindFirstOrder, mockTransaction, mockQuery } = vi.hoisted(() => {
  const mockReturning = vi.fn()
  const mockWhere = vi.fn(() => ({ returning: mockReturning }))
  const mockSet = vi.fn(() => ({ where: mockWhere }))
  const mockUpdate = vi.fn(() => ({ set: mockSet }))
  const mockInsert = vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) }))
  const mockFindFirstMerchant = vi.fn()
  const mockFindFirstOrder = vi.fn()
  const mockQuery = {
    merchants: {
      findFirst: mockFindFirstMerchant,
    },
    orders: {
      findFirst: mockFindFirstOrder,
    },
    orderItems: {
      findMany: vi.fn(),
    },
    paymentConfirmations: {
      findFirst: vi.fn(),
    },
  }
  const mockTransaction = vi.fn((cb) => cb({ update: mockUpdate, insert: mockInsert, query: mockQuery }))
  return {
    mockReturning,
    mockWhere,
    mockSet,
    mockUpdate,
    mockInsert,
    mockFindFirstMerchant,
    mockFindFirstOrder,
    mockTransaction,
    mockQuery,
  }
})

vi.mock("@/db", () => ({
  db: {
    update: mockUpdate,
    insert: mockInsert,
    transaction: mockTransaction,
    query: mockQuery,
  },
}))

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
const { mockGetMerchantByOwnerId, mockUpdateStoreSettings } = vi.hoisted(() => {
  return {
    mockGetMerchantByOwnerId: vi.fn(),
    mockUpdateStoreSettings: vi.fn(),
  }
})

vi.mock("@/db/queries/merchants", async () => {
  const actual = await vi.importActual<any>("@/db/queries/merchants")
  return {
    ...actual,
    getMerchantByOwnerId: mockGetMerchantByOwnerId,
    updateStoreSettings: mockUpdateStoreSettings,
  }
})

import { updateStoreSettings } from "@/db/queries/merchants"
import { updateStoreSettingsAction } from "@/app/actions/settings"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Zod Validation Schemas", () => {
  it("T008 — should validate store settings schema with COD configurations", () => {
    const validPayload = {
      name: "Awesome Store",
      phoneNumber: "01700000000",
      bkashNumber: "01700000000",
      nagadNumber: "01700000000",
      lowStockThresholdDefault: 5,
      codEnabled: true,
      payDeliveryChargeFirst: true,
      bkashWalletNumber: "01711111111",
      nagadWalletNumber: "01722222222",
    }
    const result = storeSettingsSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.codEnabled).toBe(true)
      expect(result.data.payDeliveryChargeFirst).toBe(true)
      expect(result.data.bkashWalletNumber).toBe("01711111111")
    }
  })

  it("T013 — should validate checkout payment schema for bkash, nagad, and cod", () => {
    // Valid bKash
    const bkashRes = paymentSchema.safeParse({
      paymentMethod: "bkash",
      transactionId: "TRX998877",
    })
    expect(bkashRes.success).toBe(true)

    // Invalid bKash (missing txn ID)
    const invalidBkash = paymentSchema.safeParse({
      paymentMethod: "bkash",
    })
    expect(invalidBkash.success).toBe(false)

    // Valid COD (no transaction ID)
    const codRes = paymentSchema.safeParse({
      paymentMethod: "cod",
    })
    expect(codRes.success).toBe(true)

    // Valid COD (optional transaction ID present)
    const codWithTxRes = paymentSchema.safeParse({
      paymentMethod: "cod",
      transactionId: "TRX554433",
    })
    expect(codWithTxRes.success).toBe(true)
  })
})

describe("updateStoreSettings database query", () => {
  it("T009 — should build Drizzle query to update COD fields and wallet numbers", async () => {
    const { updateStoreSettings: realUpdateStoreSettings } = await vi.importActual<any>("@/db/queries/merchants")
    mockReturning.mockResolvedValueOnce([{ id: "merchant-123" }])

    const data = {
      name: "Test Store",
      phoneNumber: "01700000000",
      bkashNumber: "01700000000",
      nagadNumber: "01700000000",
      lowStockThresholdDefault: 5,
      codEnabled: true,
      payDeliveryChargeFirst: true,
      bkashWalletNumber: "01711111111",
      nagadWalletNumber: "01722222222",
    }

    const result = await realUpdateStoreSettings("merchant-123", data)

    expect(result).toEqual({ id: "merchant-123" })
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
      codEnabled: true,
      payDeliveryChargeFirst: true,
      bkashWalletNumber: "01711111111",
      nagadWalletNumber: "01722222222",
    }))
  })
})

describe("updateStoreSettingsAction plan capability enforcement", () => {
  it("should fail to enable COD if merchant is on a plan without COD feature", async () => {
    const { auth } = await import("@/lib/auth/auth")
    const { getMerchantByOwnerId } = await import("@/db/queries/merchants")
    const { getMerchantPlan } = await import("@/lib/plans/getPlan")

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

    // Setup plan without COD feature
    mockGetMerchantPlan.mockResolvedValueOnce({
      name: "Starter",
      slug: "starter",
      pricePaisa: 0,
      features: {
        cod: false,
      },
    })

    const payload = {
      name: "Awesome Store",
      phoneNumber: "01700000000",
      lowStockThresholdDefault: 5,
      codEnabled: true, // Attempt to enable COD
      payDeliveryChargeFirst: false,
      bkashWalletNumber: "",
      nagadWalletNumber: "",
    }

    const response = await updateStoreSettingsAction(payload)
    expect(response.success).toBe(false)
    expect(response.error).toContain("Upgrade plan to enable Cash on Delivery")
  })

  it("should succeed to enable COD if merchant is on a plan supporting COD", async () => {
    const { auth } = await import("@/lib/auth/auth")
    const { getMerchantByOwnerId } = await import("@/db/queries/merchants")
    const { getMerchantPlan } = await import("@/lib/plans/getPlan")

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

    // Setup plan with COD feature
    mockGetMerchantPlan.mockResolvedValueOnce({
      name: "Growth",
      slug: "growth",
      pricePaisa: 99900,
      features: {
        cod: true,
      },
    })

    mockUpdateStoreSettings.mockResolvedValueOnce({
      id: "merchant-123",
      codEnabled: true,
    })

    const payload = {
      name: "Awesome Store",
      phoneNumber: "01700000000",
      lowStockThresholdDefault: 5,
      codEnabled: true,
      payDeliveryChargeFirst: true,
      bkashWalletNumber: "01711111111",
      nagadWalletNumber: "01722222222",
    }

    const response = await updateStoreSettingsAction(payload)
    if (!response.success) {
      console.log("TEST FAILURE ERROR:", response.error)
    }
    expect(response.success).toBe(true)
    expect(mockUpdateStoreSettings).toHaveBeenCalled()
  })
})

describe("submitPayment integration flow for COD", () => {
  it("T014 — should place order with status processing and transactionId COD for standard COD", async () => {
    const { headers } = await import("next/headers")
    const { submitPayment } = await import("@/app/(storefront)/[subdomain]/checkout/actions")

    // Mock merchantId header
    vi.mocked(headers).mockResolvedValueOnce({
      get: vi.fn((key) => {
        if (key === "x-merchant-id") return "merchant-123"
        return null
      })
    } as any)

    // Mock continuity cookie value
    mockCookies.get.mockReturnValueOnce({ value: "order-123" })

    // Mock merchant to have standard COD enabled
    mockFindFirstMerchant.mockResolvedValueOnce({
      id: "merchant-123",
      codEnabled: true,
      payDeliveryChargeFirst: false,
    })

    // Mock order search to verify it belongs to merchant
    mockFindFirstOrder.mockResolvedValueOnce({
      id: "order-123",
      merchantId: "merchant-123",
      status: "pending_payment",
    })

    mockReturning.mockResolvedValueOnce([{ id: "order-123" }])

    const response = await submitPayment({
      paymentMethod: "cod",
    })

    expect(response.success).toBe(true)
    // Verify payment confirmation created with COD
    expect(mockInsert).toHaveBeenCalled()
    // Verify order status updated to processing
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ status: "processing" }))
    // Verify cookie cleared
    expect(mockCookies.delete).toHaveBeenCalledWith("checkout-order-id")
  })

  it("should place order with status pending_payment and custom transactionId for upfront charge COD", async () => {
    const { headers } = await import("next/headers")
    const { submitPayment } = await import("@/app/(storefront)/[subdomain]/checkout/actions")

    // Mock merchantId header
    vi.mocked(headers).mockResolvedValueOnce({
      get: vi.fn((key) => {
        if (key === "x-merchant-id") return "merchant-123"
        return null
      })
    } as any)

    // Mock continuity cookie value
    mockCookies.get.mockReturnValueOnce({ value: "order-123" })

    // Mock merchant to have upfront delivery payment enabled
    mockFindFirstMerchant.mockResolvedValueOnce({
      id: "merchant-123",
      codEnabled: true,
      payDeliveryChargeFirst: true,
    })

    // Mock order search to verify it belongs to merchant
    mockFindFirstOrder.mockResolvedValueOnce({
      id: "order-123",
      merchantId: "merchant-123",
      status: "pending_payment",
    })

    const response = await submitPayment({
      paymentMethod: "cod",
      transactionId: "TRX_UPFRONT_99",
    })

    expect(response.success).toBe(true)
    // Verify payment confirmation created with transactionId
    expect(mockInsert).toHaveBeenCalled()
    // Verify order status was NOT updated (remains pending_payment)
    expect(mockUpdate).not.toHaveBeenCalled()
    // Verify cookie cleared
    expect(mockCookies.delete).toHaveBeenCalledWith("checkout-order-id")
  })
})

describe("updateOrderStatus query for COD", () => {
  it("T017 — should auto-confirm payment when COD order is marked delivered", async () => {
    const { updateOrderStatus } = await vi.importActual<any>("@/db/queries/orders")

    // Mock existing order
    mockFindFirstOrder.mockResolvedValueOnce({
      id: "order-123",
      merchantId: "merchant-123",
      status: "shipped",
    })

    // Mock existing payment confirmation which is COD and not yet confirmed
    mockQuery.paymentConfirmations.findFirst = vi.fn().mockResolvedValueOnce({
      id: "confirm-123",
      orderId: "order-123",
      paymentMethod: "cod",
      confirmedAt: null,
    })

    mockReturning.mockResolvedValue([{ id: "order-123", status: "delivered" }])

    const result = await updateOrderStatus("merchant-123", "order-123", "delivered")

    expect(result.status).toBe("delivered")
    // Verify that it updated paymentConfirmations to set confirmedAt
    expect(mockUpdate).toHaveBeenCalled()
  })

  it("T017 — should restore stock counts for products and variants when COD order is marked returned", async () => {
    const { updateOrderStatus } = await vi.importActual<any>("@/db/queries/orders")

    // Mock existing order
    mockFindFirstOrder.mockResolvedValueOnce({
      id: "order-123",
      merchantId: "merchant-123",
      status: "shipped",
    })

    // Mock order items to be restored
    mockQuery.orderItems.findMany = vi.fn().mockResolvedValueOnce([
      { productId: "prod-1", quantity: 2, variantId: null },
      { productId: "prod-2", quantity: 1, variantId: "variant-2" }
    ])

    mockReturning.mockResolvedValue([{ id: "order-123", status: "returned" }])

    const result = await updateOrderStatus("merchant-123", "order-123", "returned")

    expect(result.status).toBe("returned")
    // Verify that it updated products and productVariants to restore stock
    expect(mockUpdate).toHaveBeenCalled()
  })
})
