import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getCachedMerchantPlan } from "@/lib/cache/plans"
import { ProductForm } from "@/components/dashboard/ProductForm"
import { redirect } from "next/navigation"
import { Suspense } from "react"

export default function NewProductPage() {
  return (
    <Suspense fallback={<NewProductSkeleton />}>
      <NewProductPageContent />
    </Suspense>
  )
}

async function NewProductPageContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    redirect("/login")
  }
  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    redirect("/onboarding")
  }

  const plan = await getCachedMerchantPlan(merchant.id)
  const maxImages = plan?.features.max_images_per_product ?? 5
  const imageSizeLimitMb = plan?.features.image_size_limit_mb ?? 2

  const preGeneratedId = crypto.randomUUID()

  return (
    <ProductForm
      merchantId={merchant.id}
      productId={preGeneratedId}
      maxImages={maxImages}
      imageSizeLimitMb={imageSizeLimitMb}
    />
  )
}

function NewProductSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse text-foreground">
      <div className="pb-2 border-b border-border">
        <div className="h-8 w-48 bg-muted rounded-full" />
        <div className="h-4 w-64 bg-muted rounded-full mt-2" />
      </div>
      <div className="bg-card border border-border rounded-xl p-6 h-96 w-full" />
    </div>
  )
}
