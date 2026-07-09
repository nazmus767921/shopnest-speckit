import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getDiscountCodes } from "@/db/queries/discounts"
import { DiscountsClient } from "./components/DiscountsClient"
import { PlanUpsellBanner } from "./components/PlanUpsellBanner"
import { getMerchantPlan } from "@/lib/plans/getPlan"
import { Suspense } from "react"

export const metadata = {
  title: "Discount Codes — ShopNest Dashboard",
  description: "Create and manage discount codes for your storefront.",
}

export default function DiscountsPage() {
  return (
    <Suspense fallback={<DiscountsSkeleton />}>
      <DiscountsPageContent />
    </Suspense>
  )
}

async function DiscountsPageContent() {
  const session = await auth.api.getSession({ headers: await headers() })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-64 text-foreground">
        <p className="text-muted-foreground">Merchant account not found.</p>
      </div>
    )
  }

  const plan = await getMerchantPlan(merchant.id)
  const hasDiscountCodes = plan?.features.discount_codes ?? false
  const initialCodes = hasDiscountCodes ? await getDiscountCodes(merchant.id) : []

  return (
    <div className="flex flex-col gap-8 animate-fade-in text-foreground">
      {/* Page Header */}
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
          Discount Codes
        </h1>
        <p className="text-sm text-muted-foreground font-light mt-1">
          Create and manage promotional discount codes for your customers.
        </p>
      </div>

      {!hasDiscountCodes ? (
        <PlanUpsellBanner />
      ) : (
        <DiscountsClient initialCodes={initialCodes} merchantId={merchant.id} />
      )}
    </div>
  )
}

function DiscountsSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse text-foreground">
      <div className="pb-2 border-b border-border">
        <div className="h-8 w-48 bg-muted rounded-full" />
        <div className="h-4 w-64 bg-muted rounded-full mt-2" />
      </div>
      <div className="bg-card border border-border rounded-xl p-6 h-64 w-full" />
    </div>
  )
}
