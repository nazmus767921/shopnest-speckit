import { Card } from "@/components/ui/card"
import { getRecentOrdersFeed } from "@/db/queries/dashboard"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string, className: string }> = {
    pending_payment: { label: "Pending", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 hover:bg-amber-200" },
    processing: { label: "Processing", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200" },
    shipped: { label: "Shipped", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 hover:bg-indigo-200" },
    delivered: { label: "Delivered", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-200" },
    cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive hover:bg-destructive/20" },
  }

  const badgeProps = map[status] || { label: status, className: "bg-muted text-muted-foreground" }

  return (
    <Badge variant="secondary" className={cn("text-[10px] font-semibold", badgeProps.className)}>
      {badgeProps.label}
    </Badge>
  )
}

export async function RecentOrdersFeed({ merchantId }: { merchantId: string }) {
  const orders = await getRecentOrdersFeed(merchantId, 15) // fetch a bit more for scroll area

  return (
    <Card className="p-0 h-full border border-border flex flex-col">
      <div className="p-6 pb-4 border-b border-border flex justify-between items-center shrink-0">
        <h3 className="font-semibold text-lg text-foreground">Recent Orders</h3>
      </div>
      
      <ScrollArea className="flex-1 min-h-0 px-6">
        <div className="flex flex-col gap-0 pb-2">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No recent orders found.</p>
          ) : (
            orders.map((order) => (
              <Link 
                href={`/dashboard/orders/${order.id}`} 
                key={order.id} 
                className="flex justify-between items-center py-4 border-b border-border last:border-0 hover:bg-accent px-2 -mx-2 rounded-lg transition-colors duration-200 group"
              >
                <div className="flex flex-col gap-1 group-hover:translate-x-1 transition-transform duration-200">
                  <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{order.customerName || 'Guest'}</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
                </div>
                <div className="flex flex-col items-end gap-1.5 group-hover:-translate-x-1 transition-transform duration-200">
                  <span className="font-bold text-sm text-foreground">৳{(order.totalPaisa / 100).toLocaleString()}</span>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border shrink-0 mt-auto">
        <Button variant="ghost" className="w-full font-medium" asChild>
          <Link href="/dashboard/orders">
            View All Orders
          </Link>
        </Button>
      </div>
    </Card>
  )
}
