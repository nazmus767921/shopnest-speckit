import { describe, it, expect, vi, beforeEach } from "vitest"
import { db } from "@/db"
import { bindGuestOrdersToUser } from "../customers"

vi.mock("@/db", () => {
  const mockSelect = vi.fn().mockReturnThis()
  const mockFrom = vi.fn().mockReturnThis()
  const mockWhere = vi.fn().mockResolvedValue([])
  const mockUpdate = vi.fn().mockReturnThis()
  const mockSet = vi.fn().mockReturnThis()

  return {
    db: {
      select: mockSelect,
      from: mockFrom,
      where: mockWhere,
      update: mockUpdate,
      set: mockSet,
    },
  }
})

describe("Retroactive Guest Order Binding", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should trigger database query updates to rebind guest orders", async () => {
    const mockFrom = vi.spyOn(db as any, "from")
    const mockUpdate = vi.spyOn(db, "update")

    await bindGuestOrdersToUser(
      "user_registered_id",
      "customer@example.com",
      "01711111111",
      "merchant_1"
    )

    expect(mockFrom).toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalled()
  })
})
