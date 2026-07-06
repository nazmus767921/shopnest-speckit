import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock supabaseAdmin first to prevent initialization throws
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
  },
}))

import { updateVariantAction } from "@/app/actions/variants"
import { products } from "@/db/schema"

// Helper to create a chainable thenable mock for Drizzle query builder
function createMockQueryBuilder(resolvedValue: any) {
  const builder: any = {
    select: vi.fn(() => builder),
    from: vi.fn(() => builder),
    where: vi.fn(() => builder),
    set: vi.fn(() => builder),
    returning: vi.fn(() => builder),
    leftJoin: vi.fn(() => builder),
    then: vi.fn((onFulfilled) => Promise.resolve(resolvedValue).then(onFulfilled)),
    catch: vi.fn((onRejected) => Promise.resolve(resolvedValue).catch(onRejected)),
  }
  return builder
}

const {
  mockSelect,
  mockUpdate,
  mockInsert,
} = vi.hoisted(() => {
  const mockSelect = vi.fn()
  const mockUpdate = vi.fn(() => createMockQueryBuilder([]))
  const mockInsert = vi.fn(() => ({
    values: vi.fn().mockResolvedValue([]),
  }))
  return {
    mockSelect,
    mockUpdate,
    mockInsert,
  }
})

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
    transaction: vi.fn((cb) =>
      cb({
        select: mockSelect,
        update: mockUpdate,
        insert: mockInsert,
      })
    ),
  },
}))

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(() => Promise.resolve({ user: { id: "user-123", email: "merch@test.com" } })),
    },
  },
}))

vi.mock("@/db/queries/merchants", () => ({
  getMerchantByOwnerId: vi.fn(() => Promise.resolve({ id: "merch-123", subdomain: "test" })),
}))

vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("variants actions — Parent Stock Sync TDD", () => {
  beforeEach(() => {
    mockSelect.mockReset()
    mockUpdate.mockReset()
    mockInsert.mockReset()

    mockUpdate.mockReturnValue(createMockQueryBuilder([{ id: "var-123", productId: "prod-123" }]))
  })

  it("T1.3 — updateVariantAction should trigger sync of parent product stockCount", async () => {
    // 1. Mock select to check variant belongs to merchant
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([{ id: "var-123", productId: "prod-123" }]))

    // 2. Mock select for accumulated stock sum
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([{ totalStock: 45 }]))

    const response = await updateVariantAction("var-123", { stockCount: 15 })

    expect(response.success).toBe(true)
    // Verifying it updated the products table with the synced stockCount
    expect(mockUpdate).toHaveBeenCalledWith(products)
  })
})
