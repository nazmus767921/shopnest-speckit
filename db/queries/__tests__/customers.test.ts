import { describe, it, expect, vi, beforeEach } from "vitest"

// Helper to create a chainable thenable mock for Drizzle query builder
function createMockQueryBuilder(resolvedValue: any) {
  const builder: any = {
    select: vi.fn(() => builder),
    from: vi.fn(() => builder),
    where: vi.fn(() => builder),
    orderBy: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    offset: vi.fn(() => builder),
    set: vi.fn(() => builder),
    values: vi.fn(() => builder),
    onConflictDoUpdate: vi.fn(() => builder),
    returning: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    then: vi.fn((onFulfilled) => Promise.resolve(resolvedValue).then(onFulfilled)),
    catch: vi.fn((onRejected) => Promise.resolve(resolvedValue).catch(onRejected)),
  }
  return builder
}

const {
  mockSelect,
  mockUpdate,
  mockInsert,
  mockDelete,
  mockFindFirst,
} = vi.hoisted(() => {
  const mockSelect = vi.fn()
  const mockUpdate = vi.fn()
  const mockInsert = vi.fn()
  const mockDelete = vi.fn()
  const mockFindFirst = vi.fn()

  return {
    mockSelect,
    mockUpdate,
    mockInsert,
    mockDelete,
    mockFindFirst,
  }
})

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    query: {
      user: {
        findFirst: mockFindFirst,
      },
      bannedIps: {
        findFirst: mockFindFirst,
      },
    },
  },
}))

import {
  getCustomersByMerchant,
  getCustomerDetails,
  saveCustomerAddress,
  banCustomer,
  unbanCustomer,
  banIpAddress,
  unbanIpAddress,
  isIpBanned,
  bindGuestOrdersToUser,
} from "../customers"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Customers DB Queries", () => {
  describe("getCustomersByMerchant", () => {
    it("should select users matching merchant and role", async () => {
      // Mock the customers select query
      mockSelect.mockReturnValueOnce(createMockQueryBuilder([{ id: "customer_1", name: "John" }]))
      // Mock the count query
      mockSelect.mockReturnValueOnce(createMockQueryBuilder([{ count: 1 }]))

      const result = await getCustomersByMerchant("merchant_1")

      expect(mockSelect).toHaveBeenCalledTimes(2)
      expect(result.customers).toHaveLength(1)
      expect(result.totalCount).toBe(1)
    })
  })

  describe("getCustomerDetails", () => {
    it("should query user findFirst and orders total spend", async () => {
      mockFindFirst.mockResolvedValueOnce({
        id: "customer_1",
        name: "John",
        customerAddresses: [],
      })
      mockSelect.mockReturnValueOnce(createMockQueryBuilder([{ totalSpend: 5000, ordersCount: 2 }]))

      const result = await getCustomerDetails("merchant_1", "customer_1")

      expect(mockFindFirst).toHaveBeenCalled()
      expect(mockSelect).toHaveBeenCalled()
      expect(result?.totalSpend).toBe(5000)
      expect(result?.ordersCount).toBe(2)
    })
  })

  describe("saveCustomerAddress", () => {
    it("should insert address when no ID is provided", async () => {
      mockInsert.mockReturnValueOnce(createMockQueryBuilder([{ id: "address_1", name: "Dhaka Office" }]))

      const result = await saveCustomerAddress("user_1", "merchant_1", {
        name: "John",
        phone: "01711111111",
        address: "Banani",
        city: "Dhaka",
      })

      expect(mockInsert).toHaveBeenCalled()
      expect(result.id).toBe("address_1")
    })
  })

  describe("banCustomer", () => {
    it("should update user table with banned true", async () => {
      mockUpdate.mockReturnValueOnce(createMockQueryBuilder([]))
      await banCustomer("merchant_1", "customer_1", "fraud")
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  describe("unbanCustomer", () => {
    it("should update user table with banned false", async () => {
      mockUpdate.mockReturnValueOnce(createMockQueryBuilder([]))
      await unbanCustomer("merchant_1", "customer_1")
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  describe("banIpAddress", () => {
    it("should insert or update blocked IP list", async () => {
      mockInsert.mockReturnValueOnce(createMockQueryBuilder([{ ipAddress: "192.168.1.1" }]))

      const result = await banIpAddress("merchant_1", "192.168.1.1", "spam")

      expect(mockInsert).toHaveBeenCalled()
      expect(result.ipAddress).toBe("192.168.1.1")
    })
  })

  describe("isIpBanned", () => {
    it("should check if IP is stored in blocked list", async () => {
      mockFindFirst.mockResolvedValueOnce({ ipAddress: "192.168.1.1" })

      const result = await isIpBanned("merchant_1", "192.168.1.1")

      expect(result).toBe(true)
    })
  })

  describe("bindGuestOrdersToUser", () => {
    it("should update orders to assign userId", async () => {
      mockSelect.mockReturnValueOnce(createMockQueryBuilder([])) // anonymous query
      mockUpdate.mockReturnValueOnce(createMockQueryBuilder([])) // update query

      await bindGuestOrdersToUser("user_1", "john@example.com", "01711111111", "merchant_1")

      expect(mockUpdate).toHaveBeenCalled()
    })
  })
})
