import { Card } from "@/components/ui/card"
import { getPendingVerificationsCount, getLowStockAlerts, getOutOfStockAlerts } from "@/db/queries/dashboard"
import { AlertCircleIcon, PackageIcon, AlertOctagonIcon, ArrowRightIcon } from "@/lib/icons"
import Link from "next/link"

export async function DashboardActionAlerts({ merchantId }: { merchantId: string }) {
  const [
    pendingVerifications,
    lowStock,
    outOfStock
  ] = await Promise.all([
    getPendingVerificationsCount(merchantId),
    getLowStockAlerts(merchantId),
    getOutOfStockAlerts(merchantId)
  ])

  return (
    <div className="flex flex-col gap-4">
      {/* Orders Needing Attention */}
      <Card className="p-5 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 rounded-lg shrink-0">
            <AlertCircleIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col flex-1 gap-1">
            <h3 className="font-semibold text-foreground">Orders Needing Attention</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              {pendingVerifications} order(s) have pending payment confirmations waiting for your verification.
            </p>
            {pendingVerifications > 0 && (
              <Link href="/dashboard/orders?status=pending_payment" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline">
                Review payments <ArrowRightIcon className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Out of Stock Alert */}
      {outOfStock.count > 0 && (
        <Card className="p-5 border-destructive/30 bg-destructive/5 dark:bg-destructive/10">
          <div className="flex items-start gap-4">
             <div className="p-2.5 bg-destructive/10 text-destructive rounded-lg shrink-0">
              <AlertOctagonIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col flex-1 gap-1">
              <h3 className="font-semibold text-destructive">Out of Stock</h3>
              <p className="text-sm text-muted-foreground leading-snug">
                {outOfStock.count} published product(s) have reached 0 inventory.
              </p>
              <div className="flex flex-col gap-1.5 mt-3">
                {outOfStock.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="font-medium truncate">{item.name}</span>
                    <span className="text-destructive font-bold px-2 py-0.5 rounded-md bg-destructive/10 text-xs shrink-0">0 left</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/products" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-destructive hover:underline">
                Manage inventory <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Low Stock Alert */}
      {lowStock.count > 0 && (
        <Card className="p-5">
           <div className="flex items-start gap-4">
             <div className="p-2.5 bg-muted text-muted-foreground rounded-lg shrink-0">
              <PackageIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col flex-1 gap-1">
              <h3 className="font-semibold text-foreground">Low Stock Warning</h3>
              <p className="text-sm text-muted-foreground leading-snug">
                {lowStock.count} product(s) are running low on inventory.
              </p>
              <div className="flex flex-col gap-1.5 mt-3">
                {lowStock.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="font-medium truncate">{item.name}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900 text-xs shrink-0">{item.stockCount} left</span>
                  </div>
                ))}
              </div>
               <Link href="/dashboard/products" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary hover:underline">
                Restock products <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
