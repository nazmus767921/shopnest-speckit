import { Card } from "@/components/ui/card"
import { getDashboardRevenueStats, getDashboardOrderStats, getPendingVerificationsCount, getLowStockAlerts } from "@/db/queries/dashboard"
import { ArrowDownIcon, ArrowUpIcon, ShoppingBagIcon, PackageIcon, AlertCircleIcon, StoreIcon, TagIcon } from "@/lib/icons"
import { db } from "@/db"
import { orders, products } from "@/db/schema"
import { eq, isNull, inArray, sum, count, and } from "drizzle-orm"

import Link from "next/link"

// Needs to be Server Component to fetch data
export async function DashboardKPIs({ merchantId, days = 1 }: { merchantId: string, days?: number }) {
  // Fetch data in parallel
  const [
    revenueStats,
    orderStats,
    pendingVerifications,
    lowStock,
    totalSalesResult,
    activeProductsResult
  ] = await Promise.all([
    getDashboardRevenueStats(merchantId, days),
    getDashboardOrderStats(merchantId, days),
    getPendingVerificationsCount(merchantId),
    getLowStockAlerts(merchantId),
    db.select({ value: sum(orders.totalPaisa) }).from(orders).where(and(eq(orders.merchantId, merchantId), inArray(orders.status, ["processing", "shipped", "delivered"]))),
    db.select({ value: count() }).from(products).where(and(eq(products.merchantId, merchantId), isNull(products.deletedAt)))
  ])

  // Calculation for delta
  const revenueDelta = revenueStats.yesterday === 0 
    ? (revenueStats.today === 0 ? 0 : 100) 
    : ((revenueStats.today - revenueStats.yesterday) / revenueStats.yesterday) * 100
  
  const orderDelta = orderStats.yesterday === 0 
    ? (orderStats.today === 0 ? 0 : 100) 
    : ((orderStats.today - orderStats.yesterday) / orderStats.yesterday) * 100

  const totalSalesTaka = Number(totalSalesResult[0]?.value || 0) / 100
  const activeProducts = activeProductsResult[0]?.value || 0

  const periodLabel = days === 1 ? "Today's" : `Last ${days} Days`
  const vsLabel = days === 1 ? "Yesterday" : `Previous ${days} Days`

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <Link href="/dashboard/orders" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
          <Card className="p-6 hover:shadow-md transition-all cursor-pointer h-full bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{periodLabel} Revenue</span>
                <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">৳{(revenueStats.today / 100).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs font-medium">
              {revenueDelta >= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><ArrowUpIcon className="w-3 h-3"/> {revenueDelta.toFixed(1)}% vs {vsLabel}</span>
              ) : (
                <span className="text-destructive flex items-center gap-1"><ArrowDownIcon className="w-3 h-3"/> {Math.abs(revenueDelta).toFixed(1)}% vs {vsLabel}</span>
              )}
            </div>
          </Card>
        </Link>

        {/* Orders */}
        <Link href="/dashboard/orders" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
          <Card className="p-6 hover:shadow-md transition-all cursor-pointer h-full bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">{periodLabel} Orders</span>
                <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">{orderStats.today}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs font-medium">
              {orderDelta >= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><ArrowUpIcon className="w-3 h-3"/> {orderDelta.toFixed(1)}% vs {vsLabel}</span>
              ) : (
                <span className="text-destructive flex items-center gap-1"><ArrowDownIcon className="w-3 h-3"/> {Math.abs(orderDelta).toFixed(1)}% vs {vsLabel}</span>
              )}
            </div>
          </Card>
        </Link>

        {/* Pending Verifications */}
        <Link href="/dashboard/orders?status=pending_payment" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
          <Card className="p-6 hover:shadow-md transition-all cursor-pointer h-full bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Orders</span>
                <span className="text-2xl font-bold text-amber-900 dark:text-amber-100">{pendingVerifications}</span>
              </div>
              <div className="p-2.5 bg-amber-500/20 rounded-lg border border-amber-500/30">
                <AlertCircleIcon className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Low Stock */}
        <Link href="/dashboard/products" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
          <Card className="p-6 hover:shadow-md transition-all cursor-pointer h-full bg-destructive/10 border-destructive/20 hover:bg-destructive/20">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">Low Stock</span>
                <span className="text-2xl font-bold text-red-900 dark:text-red-100">{lowStock.count}</span>
              </div>
              <div className="p-2.5 bg-destructive/20 rounded-lg border border-destructive/30">
                <PackageIcon className="h-4 w-4 text-destructive" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/orders" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
          <Card className="p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer h-full bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Total Revenue</span>
                <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">৳{totalSalesTaka.toLocaleString()}</span>
              </div>
              <div className="p-2.5 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <ShoppingBagIcon className="h-4 w-4 text-purple-700 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/products" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
          <Card className="p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer h-full bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/20">
             <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">Active Products</span>
                <span className="text-2xl font-bold text-teal-900 dark:text-teal-100">{activeProducts}</span>
              </div>
              <div className="p-2.5 bg-teal-500/20 rounded-lg border border-teal-500/30">
                <StoreIcon className="h-4 w-4 text-teal-700 dark:text-teal-400" />
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}

