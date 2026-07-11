import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getProductById } from "@/db/queries/products"
import { getCachedMerchantPlan } from "@/lib/cache/plans"
import { redirect, notFound } from "next/navigation"
import { Suspense } from "react"
import { EditProductTabs } from "@/components/dashboard/edit-product/EditProductTabs"

interface Props {
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: Props) {
  return (
    <Suspense fallback={<EditProductSkeleton />}>
      <EditProductPageContent params={params} />
    </Suspense>
  )
}

async function EditProductPageContent({ params }: Props) {
  const { id } = await params

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

  const product = await getProductById(merchant.id, id)
  if (!product) {
    notFound()
  }

  const plan = await getCachedMerchantPlan(merchant.id)
  const maxImages = plan?.features.max_images_per_product ?? 5
  const imageSizeLimitMb = plan?.features.image_size_limit_mb ?? 2

  return (
    <EditProductTabs
      merchantId={merchant.id}
      product={{
        id: product.id,
        name: product.name,
        description: product.description,
        pricePaisa: product.pricePaisa,
        compareAtPricePaisa: product.compareAtPricePaisa,
        stockCount: product.stockCount,
        lowStockThreshold: product.lowStockThreshold,
        isPublished: product.isPublished,
        categoryId: product.categoryId,
        promotionTypes: product.promotions.map((p) => p.promotionType),
        images: product.images.map((img) => ({
          storagePath: img.storagePath,
        })),
        hasVariants: product.hasVariants,
      }}
      maxImages={maxImages}
      imageSizeLimitMb={imageSizeLimitMb}
    />
  )
}

function EditProductSkeleton() {
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
