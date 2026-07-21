import { describe, it, expect, vi, beforeEach } from "vitest"
import { createOrder } from "@/db/queries/orders"
import { bulkCreateFlashSalesAction } from "@/app/actions/flash-sales"

// Setup Hoisted Mocks
const { mockDb, mockTxInsert, mockTxSelect, mockProductSelect } = vi.hoisted(() => {
  const mockTxSelect = vi.fn()
  const mockTxInsert = vi.fn()
  const mockProductSelect = vi.fn()

  const queryChain: any = {
    select: () => queryChain,
    from: () => queryChain,
    where: () => queryChain,
    orderBy: () => queryChain,
    limit: () => mockTxSelect(),
    for: () => queryChain,
    then: (resolve: any) => Promise.resolve(mockProductSelect()).then(resolve),
  }

  const mockTx = {
    select: () => queryChain,
    insert: () => ({
      values: () => mockTxInsert(),
    }),
    update: () => ({
      set: () => ({
        where: () => [{ id: "updated" }],
      }),
    }),
  }

  const mockDb = {
    transaction: vi.fn(async (callback) => {
      return await callback(mockTx)
    }),
  }

  return { mockDb, mockTxInsert, mockTxSelect, mockProductSelect }
})

vi.mock("@/db", () => ({
  db: mockDb,
}))

// Mock auth dependencies
const mockGetSession = vi.fn()
const mockGetMerchantByOwnerId = vi.fn()

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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve({ get: () => "mock-header" }),
}))

describe("Variant-Level Flash Sales", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should validate and fail bulk launch if variant-specific campaign overlaps", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
    mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })

    // Mock overlap check returning an existing sale record (overlap exists)
    mockTxSelect.mockResolvedValue([{ id: "existing-sale" }])
    // Mock product name query
    mockProductSelect.mockResolvedValue([{ name: "Mock Product" }])

    const start = new Date(Date.now() + 3600 * 1000).toISOString()
    const end = new Date(Date.now() + 7200 * 1000).toISOString()

    const result = await bulkCreateFlashSalesAction([
      {
        productId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        variantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        salePricePaisa: 150000,
        limitQuantity: 10,
        startTime: start,
        endTime: end,
      },
    ])

    expect(result.success).toBe(false)
    expect(result.error).toContain("overlapping active flash sale campaign")
    expect(mockTxInsert).not.toHaveBeenCalled()
  })

  it("should successfully launch variant campaigns when no overlap is found", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
    mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })

    // Mock overlap check returning empty array (no overlaps)
    mockTxSelect.mockResolvedValue([])
    mockTxInsert.mockResolvedValue([{ id: "new-sale" }])

    const start = new Date(Date.now() + 3600 * 1000).toISOString()
    const end = new Date(Date.now() + 7200 * 1000).toISOString()

    const result = await bulkCreateFlashSalesAction([
      {
        productId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        variantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        salePricePaisa: 150000,
        limitQuantity: 10,
        startTime: start,
        endTime: end,
      },
    ])

    expect(result.success).toBe(true)
    expect(mockTxInsert).toHaveBeenCalled()
  })
})
