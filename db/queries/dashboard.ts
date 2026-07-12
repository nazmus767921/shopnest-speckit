import { db } from "@/db"
import { orders, products, paymentConfirmations, orderItems, productImages } from "@/db/schema"
import { eq, and, sql, desc, isNull, sum, count, gte, lt, inArray, isNotNull } from "drizzle-orm"

export async function getDashboardRevenueStats(merchantId: string, days = 1) {
  const now = new Date()
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  
  const startOfCurrentPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1)
  const startOfPreviousPeriod = new Date(startOfCurrentPeriod)
  startOfPreviousPeriod.setDate(startOfPreviousPeriod.getDate() - days)

  const recentOrders = await db
    .select({
      totalPaisa: orders.totalPaisa,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.merchantId, merchantId),
        gte(orders.createdAt, startOfPreviousPeriod),
        sql`${orders.status} != 'cancelled'`
      )
    )

  let today = 0 // represents current period
  let yesterday = 0 // represents previous period

  for (const order of recentOrders) {
    if (order.createdAt >= startOfCurrentPeriod) {
      today += order.totalPaisa
    } else {
      yesterday += order.totalPaisa
    }
  }

  return { today, yesterday }
}

export async function getDashboardOrderStats(merchantId: string, days = 1) {
  const now = new Date()
  
  const startOfCurrentPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1)
  const startOfPreviousPeriod = new Date(startOfCurrentPeriod)
  startOfPreviousPeriod.setDate(startOfPreviousPeriod.getDate() - days)

  const recentOrders = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.merchantId, merchantId),
        gte(orders.createdAt, startOfPreviousPeriod)
      )
    )

  let today = 0 // represents current period
  let yesterday = 0 // represents previous period

  for (const order of recentOrders) {
    if (order.createdAt >= startOfCurrentPeriod) {
      today++
    } else {
      yesterday++
    }
  }

  return { today, yesterday }
}

export async function getPendingVerificationsCount(merchantId: string) {
  const result = await db
    .select({ count: count() })
    .from(orders)
    .innerJoin(paymentConfirmations, eq(orders.id, paymentConfirmations.orderId))
    .where(
      and(
        eq(orders.merchantId, merchantId),
        eq(orders.status, "pending_payment")
      )
    )

  return result[0]?.count ?? 0
}

export async function getLowStockAlerts(merchantId: string) {
  const result = await db
    .select({
      id: products.id,
      name: products.name,
      stockCount: products.stockCount,
    })
    .from(products)
    .where(
      and(
        eq(products.merchantId, merchantId),
        sql`${products.stockCount} > 0`,
        sql`${products.stockCount} <= ${products.lowStockThreshold}`,
        eq(products.isPublished, true),
        isNull(products.deletedAt)
      )
    )
    .orderBy(products.stockCount)
    .limit(3)

  const countResult = await db
    .select({ count: count() })
    .from(products)
    .where(
      and(
        eq(products.merchantId, merchantId),
        sql`${products.stockCount} > 0`,
        sql`${products.stockCount} <= ${products.lowStockThreshold}`,
        eq(products.isPublished, true),
        isNull(products.deletedAt)
      )
    )

  return {
    count: countResult[0]?.count ?? 0,
    items: result,
  }
}

export async function getOutOfStockAlerts(merchantId: string) {
  const result = await db
    .select({
      id: products.id,
      name: products.name,
      stockCount: products.stockCount,
    })
    .from(products)
    .where(
      and(
        eq(products.merchantId, merchantId),
        eq(products.stockCount, 0),
        eq(products.isPublished, true),
        isNull(products.deletedAt)
      )
    )
    .limit(3)

  const countResult = await db
    .select({ count: count() })
    .from(products)
    .where(
      and(
        eq(products.merchantId, merchantId),
        eq(products.stockCount, 0),
        eq(products.isPublished, true),
        isNull(products.deletedAt)
      )
    )

  return {
    count: countResult[0]?.count ?? 0,
    items: result,
  }
}

export async function getRecentOrdersFeed(merchantId: string, limitCount = 10) {
  return await db
    .select({
      id: orders.id,
      customerName: orders.deliveryName,
      totalPaisa: orders.totalPaisa,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.merchantId, merchantId))
    .orderBy(desc(orders.createdAt))
    .limit(limitCount)
}

export async function getRevenueTrendData(merchantId: string, days = 7) {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1)

  const recentOrders = await db
    .select({
      totalPaisa: orders.totalPaisa,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.merchantId, merchantId),
        gte(orders.createdAt, startDate),
        sql`${orders.status} != 'cancelled'`
      )
    )

  const dailyRevenue: Record<string, number> = {}
  
  // Initialize all days with 0
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    // format as YYYY-MM-DD in local time
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dailyRevenue[dateStr] = 0
  }

  for (const order of recentOrders) {
    const d = new Date(order.createdAt)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (dailyRevenue[dateStr] !== undefined) {
      dailyRevenue[dateStr] += order.totalPaisa
    }
  }

  return Object.entries(dailyRevenue)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getTopSellingProducts(merchantId: string, limitCount = 5) {
  const result = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      totalRevenue: sum(orderItems.unitPricePaisa),
      storagePath: productImages.storagePath
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .leftJoin(
      productImages, 
      and(
        eq(productImages.productId, orderItems.productId),
        eq(productImages.displayOrder, 0)
      )
    )
    .where(
      and(
        eq(orderItems.merchantId, merchantId),
        sql`${orders.status} != 'cancelled'`
      )
    )
    .groupBy(
      orderItems.productId, 
      orderItems.productName,
      productImages.storagePath
    )
    .orderBy(desc(sum(orderItems.unitPricePaisa)))
    .limit(limitCount)

  return result.map((row, index) => ({
    rank: index + 1,
    id: row.productId,
    name: row.productName,
    revenue: Number(row.totalRevenue) || 0,
    image: row.storagePath
  }))
}
