import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getShippingZonesWithDistricts } from "@/db/queries/shippingZones"
import { StoreSettingsForm } from "./components/StoreSettingsForm"
import { Badge } from "@/components/ui/primitives/Badge"
import { getMerchantPlan } from "@/lib/plans/getPlan"

export const metadata = {
  title: "Store Settings — ShopNest Dashboard",
  description: "Manage your store profile, payment details, and inventory preferences.",
}

import { Suspense } from "react"

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsPageContent />
    </Suspense>
  )
}

async function SettingsPageContent() {
  const session = await auth.api.getSession({ headers: await headers() })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-canvas-cream rounded-xl">
        <p className="text-body-md text-shade-50">Merchant account not found.</p>
      </div>
    )
  }

  const shippingZones = await getShippingZonesWithDistricts(merchant.id)
  const plan = await getMerchantPlan(merchant.id)

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-fade-in py-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-hairline-light">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
            Store Settings
          </h1>
          <p className="text-caption text-shade-50 font-light mt-1">
            Update your store profile, payment details, and inventory preferences.
          </p>
        </div>

        {/* Current Plan Badge in Header */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-micro font-bold text-shade-50 uppercase tracking-wider">
            Plan:
          </span>
          <Badge
            variant={plan?.slug === "growth" ? "mint" : "shade"}
            className="capitalize rounded-full px-3 py-1 font-medium"
          >
            {plan?.name ?? merchant.plan} Plan • {merchant.subscriptionStatus}
          </Badge>
        </div>
      </div>

      {/* Settings Form Wrapper */}
      <div className="w-full">
        <StoreSettingsForm
          merchant={merchant}
          shippingZones={shippingZones}
          plan={plan}
        />
      </div>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-pulse py-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-hairline-light">
        <div className="h-8 w-48 bg-shade-30 rounded-full" />
        <div className="h-6 w-32 bg-shade-30 rounded-full" />
      </div>
      <div className="h-96 bg-canvas-light border border-hairline-light rounded-lg p-6 w-full" />
    </div>
  )
}


