import { describe, it, expect, vi, beforeEach } from "vitest"
import { getStorefrontSections, saveStorefrontSections } from "../storefront-sections"

const { mockFindMany, mockTransaction, mockInsert, mockValues, mockOnConflictDoUpdate, mockSet, mockWhere, mockDelete, mockReturning } = vi.hoisted(() => {
  const mockFindMany = vi.fn()
  const mockValues = vi.fn()
  const mockOnConflictDoUpdate = vi.fn()
  const mockSet = vi.fn()
  const mockWhere = vi.fn()
  const mockReturning = vi.fn()
  const mockDelete = vi.fn()
  
  const mockInsert = vi.fn(() => ({
    values: mockValues.mockReturnValue({
      onConflictDoUpdate: mockOnConflictDoUpdate.mockReturnValue({
        returning: mockReturning.mockResolvedValue([])
      }),
      returning: mockReturning.mockResolvedValue([])
    })
  }))
  
  mockDelete.mockReturnValue({
    where: mockWhere.mockResolvedValue([])
  })

  const mockTransaction = vi.fn((cb) => cb({
    insert: mockInsert,
    delete: mockDelete,
  }))

  return { mockFindMany, mockTransaction, mockInsert, mockValues, mockOnConflictDoUpdate, mockSet, mockWhere, mockDelete, mockReturning }
})

vi.mock("@/db", () => ({
  db: {
    query: {
      storefrontSections: {
        findMany: mockFindMany,
      },
    },
    insert: mockInsert,
    delete: mockDelete,
    transaction: mockTransaction,
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Storefront Sections Queries", () => {
  describe("getStorefrontSections", () => {
    it("should fetch visible sections for a merchant ordered by sort_order", async () => {
      mockFindMany.mockResolvedValueOnce([
        { id: "1", merchantId: "m1", sectionKey: "hero", isVisible: true, sortOrder: 0 }
      ])

      const result = await getStorefrontSections("m1")

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Function),
          orderBy: expect.any(Function),
        })
      )
      expect(result).toHaveLength(1)
    })
  })

  describe("saveStorefrontSections", () => {
    it("should delete existing sections and insert new ones inside a transaction", async () => {
      const sections = [
        { sectionKey: "hero", content: { title: "Test" }, sortOrder: 0, isVisible: true }
      ]

      await saveStorefrontSections("m1", sections)

      expect(mockTransaction).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalled()
      expect(mockInsert).toHaveBeenCalled()
      expect(mockValues).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            merchantId: "m1",
            sectionKey: "hero"
          })
        ])
      )
    })
  })
})
