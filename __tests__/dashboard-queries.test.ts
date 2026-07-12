import { describe, it, expect, vi, beforeEach } from "vitest"
import { 
  getDashboardRevenueStats,
  getDashboardOrderStats,
  getPendingVerificationsCount,
  getLowStockAlerts,
  getOutOfStockAlerts,
  getRecentOrdersFeed,
  getRevenueTrendData,
  getTopSellingProducts
} from "@/db/queries/dashboard"

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([])
  }
}))

describe("dashboard queries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("getDashboardRevenueStats should return today and yesterday revenue", async () => {
    const result = await getDashboardRevenueStats("merchant-1")
    expect(result).toHaveProperty("today")
    expect(result).toHaveProperty("yesterday")
  })

  it("getDashboardOrderStats should return today and yesterday order counts", async () => {
    const result = await getDashboardOrderStats("merchant-1")
    expect(result).toHaveProperty("today")
    expect(result).toHaveProperty("yesterday")
  })

  it("getPendingVerificationsCount should return a number", async () => {
    const result = await getPendingVerificationsCount("merchant-1")
    expect(typeof result).toBe("number")
  })

  it("getLowStockAlerts should return count and items", async () => {
    const result = await getLowStockAlerts("merchant-1")
    expect(result).toHaveProperty("count")
    expect(result).toHaveProperty("items")
  })

  it("getOutOfStockAlerts should return count and items", async () => {
    const result = await getOutOfStockAlerts("merchant-1")
    expect(result).toHaveProperty("count")
    expect(result).toHaveProperty("items")
  })

  it("getRecentOrdersFeed should return array", async () => {
    const result = await getRecentOrdersFeed("merchant-1")
    expect(Array.isArray(result)).toBe(true)
  })

  it("getRevenueTrendData should return array of data points", async () => {
    const result = await getRevenueTrendData("merchant-1", 7)
    expect(Array.isArray(result)).toBe(true)
  })

  it("getTopSellingProducts should return array of products", async () => {
    const result = await getTopSellingProducts("merchant-1")
    expect(Array.isArray(result)).toBe(true)
  })
})
