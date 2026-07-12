import { Card } from "@/components/ui/card"
import { getRevenueTrendData, getTopSellingProducts } from "@/db/queries/dashboard"
import { RevenueChart } from "./RevenueChart"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

export async function DashboardAnalytics({ merchantId, days = 1 }: { merchantId: string, days?: number }) {
  const chartDays = days === 1 ? 7 : days // if today is selected, still show a 7-day trend to avoid a single point chart
  const [revenueData, topProducts] = await Promise.all([
    getRevenueTrendData(merchantId, chartDays),
    getTopSellingProducts(merchantId, 10)
  ])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Revenue Trend */}
      <Card className="p-6 lg:col-span-2 flex flex-col h-[400px]">
        <h3 className="font-semibold text-lg mb-4 text-foreground shrink-0">Revenue Trend (Last {chartDays} Days)</h3>
        <div className="flex-1 min-h-0">
          <RevenueChart data={revenueData} />
        </div>
      </Card>

      {/* Top Selling Products */}
      <Card className="p-0 lg:col-span-1 flex flex-col h-[400px] border border-border">
        <div className="p-6 pb-4 border-b border-border shrink-0">
          <h3 className="font-semibold text-lg text-foreground">Top Selling Products</h3>
        </div>
        <ScrollArea className="flex-1 min-h-0 px-4">
          <div className="flex flex-col gap-1 pb-2">
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No products sold yet.</p>
            ) : (
              topProducts.map((product) => (
                <Link
                  href={`/dashboard/products/${product.id}`}
                  key={product.id}
                  className="flex items-center justify-between gap-4 hover:bg-accent p-2 rounded-lg transition-colors duration-200 group"
                >
                  <div className="flex items-center gap-3 overflow-hidden group-hover:translate-x-1 transition-transform duration-200 flex-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold shrink-0 text-muted-foreground">
                      {product.rank}
                    </div>
                    <div className="w-10 h-10 bg-muted rounded-md overflow-hidden shrink-0 relative">
                      {product.image ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${product.image}`}
                          alt={product.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground text-[10px]">No img</div>
                      )}
                    </div>
                    <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">{product.name}</span>
                  </div>
                  <div className="shrink-0 group-hover:-translate-x-1 transition-transform duration-200">
                    <span className="text-sm font-bold text-foreground">৳{(product.revenue / 100).toLocaleString()}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}
