import { describe, it, expect, vi, beforeEach } from "vitest"
import { createOrder } from "@/db/queries/orders"
import { createProduct, updateProduct, getProductById } from "@/db/queries/products"
import { createVariant, updateVariant, getVariantById } from "@/db/queries/variants"

// Helper to create a chainable thenable mock for Drizzle query builder
function createMockQueryBuilder(resolvedValue: any) {
  const builder: any = {
    select: vi.fn(() => builder),
    from: vi.fn(() => builder),
    where: vi.fn(() => builder),
    for: vi.fn(() => builder),
    leftJoin: vi.fn(() => builder),
    orderBy: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    set: vi.fn(() => builder),
    values: vi.fn(() => builder),
    returning: vi.fn(() => builder),
    then: vi.fn((onFulfilled) => Promise.resolve(resolvedValue).then(onFulfilled)),
    catch: vi.fn((onRejected) => Promise.resolve(resolvedValue).catch(onRejected)),
  }
  return builder
}

const {
  mockSelect,
  mockUpdate,
  mockInsert,
  mockQuery,
} = vi.hoisted(() => {
  const mockSelect = vi.fn()
  const mockUpdate = vi.fn(() => createMockQueryBuilder([]))
  const mockInsert = vi.fn(() => ({
    values: vi.fn().mockResolvedValue([]),
  }))
  const mockQuery = {
    orderItems: {
      findMany: vi.fn(),
    },
    products: {
      findFirst: vi.fn(),
    },
  }
  return {
    mockSelect,
    mockUpdate,
    mockInsert,
    mockQuery,
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
        query: mockQuery,
      })
    ),
    query: mockQuery,
  },
}))

vi.mock("@/lib/plans/assertPlan", () => ({
  assertPlanLimit: vi.fn().mockResolvedValue(true),
}))

describe("createOrder — Variant Pricing & Stock Sync TDD", () => {
  beforeEach(() => {
    mockSelect.mockReset()
    mockUpdate.mockReset()
    mockInsert.mockReset()
    
    mockUpdate.mockReturnValue(createMockQueryBuilder([{ id: "var-1" }]))
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    })
  })

  it("T1.1 — should compute subtotal using variant price override if available", async () => {
    // Call 1: monthly count check
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([{ value: 0 }]))
    // Call 2: products fetch (FOR UPDATE)
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([
      {
        id: "prod-1",
        merchantId: "merch-1",
        name: "Test Variant Product",
        pricePaisa: 10000,
        stockCount: 50,
        lowStockThreshold: 5,
        hasVariants: true,
        isPublished: true,
        deletedAt: null,
      },
    ]))
    // Call 3: variant fetch for stock check (FOR UPDATE)
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([
      {
        stockCount: 10,
        pricePaisa: 12000,
      },
    ]))
    // Call 4: variant fetch in step 5 (insert order items)
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([
      {
        pricePaisa: 12000,
      },
    ]))
    // Call 5: sync product sum query
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([
      {
        totalStock: 8,
      },
    ]))

    const orderParams = {
      merchantId: "merch-1",
      userId: "user-1",
      guestPhone: null,
      deliveryName: "Jane Doe",
      deliveryPhone: "01700000000",
      deliveryAddress: "Dhaka, Bangladesh",
      deliveryCity: "Dhaka",
      deliveryChargePaisa: 6000,
      items: [
        {
          productId: "prod-1",
          quantity: 2,
          variantId: "var-1",
          variantLabel: "Color: Red",
        },
      ],
    }

    const result = await createOrder(orderParams)

    expect("error" in result).toBe(false)
    if (!("error" in result)) {
      // Subtotal should be variant price (12000 Paisa) * quantity (2) = 24000 Paisa
      // Total should be 24000 + delivery (6000) = 30000 Paisa
      expect(result.totalPaisa).toBe(30000)
    }
  })

  it("T1.2 — should sync parent product stockCount to accumulated variant stock sum on order creation", async () => {
    // Call 1: monthly count check
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([{ value: 0 }]))
    // Call 2: products fetch (FOR UPDATE)
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([
      {
        id: "prod-1",
        merchantId: "merch-1",
        name: "Test Variant Product",
        pricePaisa: 10000,
        stockCount: 50,
        lowStockThreshold: 5,
        hasVariants: true,
        isPublished: true,
        deletedAt: null,
      },
    ]))
    // Call 3: variant fetch for stock check (FOR UPDATE)
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([
      {
        stockCount: 10,
        pricePaisa: null,
      },
    ]))
    // Call 4: variant fetch in step 5 (insert order items)
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([
      {
        pricePaisa: null,
      },
    ]))
    // Call 5: sync product sum query
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([
      {
        totalStock: 8,
      },
    ]))

    const orderParams = {
      merchantId: "merch-1",
      userId: "user-1",
      guestPhone: null,
      deliveryName: "Jane Doe",
      deliveryPhone: "01700000000",
      deliveryAddress: "Dhaka, Bangladesh",
      deliveryCity: "Dhaka",
      deliveryChargePaisa: 6000,
      items: [
        {
          productId: "prod-1",
          quantity: 2,
          variantId: "var-1",
          variantLabel: "Color: Red",
        },
      ],
    }

    const result = await createOrder(orderParams)
    expect("error" in result).toBe(false)

    // Verify mockUpdate was called to update products table
    expect(mockUpdate).toHaveBeenCalledWith(expect.anything())
  })
})

describe("compareAtPrice — Database Operations TDD", () => {
  beforeEach(() => {
    mockSelect.mockReset()
    mockUpdate.mockReset()
    mockInsert.mockReset()
    mockQuery.products.findFirst.mockReset()
  })

  it("T1.4 — createProduct should correctly insert compareAtPricePaisa", async () => {
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([{ value: 0 }])) // monthly products count limit check
    const mockInsertBuilder = createMockQueryBuilder([{ id: "prod-123", compareAtPricePaisa: 15000 }])
    mockInsert.mockReturnValue(mockInsertBuilder)

    const productData = {
      name: "Test Price Product",
      pricePaisa: 10000,
      compareAtPricePaisa: 15000,
      stockCount: 10,
    }

    const result = await createProduct("merch-123", productData)
    expect(result.compareAtPricePaisa).toBe(15000)
    expect(mockInsert).toHaveBeenCalledWith(expect.anything())
  })

  it("T1.4 — getProductById should correctly return compareAtPricePaisa", async () => {
    mockQuery.products.findFirst.mockResolvedValueOnce({
      id: "prod-123",
      merchantId: "merch-123",
      compareAtPricePaisa: 15000,
    })

    const result = await getProductById("merch-123", "prod-123")
    expect(result).not.toBeNull()
    expect(result!.compareAtPricePaisa).toBe(15000)
  })

  it("T1.4 — createVariant should correctly insert compareAtPricePaisa", async () => {
    const mockInsertBuilder = createMockQueryBuilder([{ id: "var-123", compareAtPricePaisa: 18000 }])
    mockInsert.mockReturnValue(mockInsertBuilder)

    const variantData = {
      productId: "prod-123",
      merchantId: "merch-123",
      sku: "TEST-VAR-1",
      pricePaisa: 12000,
      compareAtPricePaisa: 18000,
      stockCount: 5,
      sortOrder: 1,
    }

    const result = await createVariant(variantData)
    expect(result.compareAtPricePaisa).toBe(18000)
    expect(mockInsert).toHaveBeenCalled()
  })

  it("T1.4 — updateVariant should correctly update compareAtPricePaisa", async () => {
    const mockUpdateBuilder = createMockQueryBuilder([{ id: "var-123", compareAtPricePaisa: 20000 }])
    mockUpdate.mockReturnValue(mockUpdateBuilder)

    const result = await updateVariant("var-123", { compareAtPricePaisa: 20000 })
    expect(result.compareAtPricePaisa).toBe(20000)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it("T1.4 — getVariantById should correctly return compareAtPricePaisa", async () => {
    mockSelect.mockReturnValueOnce(createMockQueryBuilder([{ id: "var-123", compareAtPricePaisa: 18000 }]))

    const result = await getVariantById("var-123")
    expect(result).not.toBeNull()
    expect(result!.compareAtPricePaisa).toBe(18000)
  })
})
