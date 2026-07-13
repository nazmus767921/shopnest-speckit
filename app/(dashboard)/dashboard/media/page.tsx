import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getMediaFiles, getMediaFolders } from "@/db/queries/media"
import { getSubscriptionByMerchantId } from "@/db/queries/subscriptions"
import { MediaLibraryClient } from "@/components/media/MediaLibraryClient"
import { connection } from "next/server"
import { Suspense } from "react"

export const metadata = {
  title: "Media Library - ShopNest",
}

export default async function MediaPage() {
  return (
    <div className="-mt-8 -mb-10 -mx-4 md:-mx-8 flex h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-3.5rem)] overflow-hidden">
      <Suspense fallback={<MediaPageSkeleton />}>
        <MediaLibraryContent />
      </Suspense>
    </div>
  )
}

async function MediaLibraryContent() {
  await connection()
  
  const session = await auth.api.getSession({
    headers: await headers()
  })
  
  if (!session?.user) {
    redirect("/sign-in")
  }
  
  const merchant = await getMerchantByOwnerId(session.user.id)
  
  if (!merchant) {
    redirect("/storefront/onboarding")
  }
  
  const [files, folders, subscription] = await Promise.all([
    getMediaFiles(merchant.id),
    getMediaFolders(merchant.id),
    getSubscriptionByMerchantId(merchant.id)
  ])

  const limitMb = subscription?.snapshotImageSizeMb ?? 2 // Default fallback

  // Convert dates to strings for client component serialization
  const serializedFiles = files.map(f => ({
    ...f,
    createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: f.updatedAt ? new Date(f.updatedAt).toISOString() : new Date().toISOString()
  }))

  const serializedFolders = folders.map(f => ({
    ...f,
    createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: f.updatedAt ? new Date(f.updatedAt).toISOString() : new Date().toISOString()
  }))
  
  return <MediaLibraryClient files={serializedFiles as any} folders={serializedFolders as any} limitMb={limitMb} />
}

function MediaPageSkeleton() {
  return (
    <div className="flex h-full bg-background overflow-hidden w-full animate-pulse">
      {/* Sidebar Skeleton */}
      <div className="w-[220px] border-r border-foreground/5 bg-muted/10 p-4 space-y-6 hidden md:block shrink-0">
        <div className="space-y-2.5">
          <div className="h-4 w-16 bg-muted rounded-full" />
          <div className="space-y-1.5">
            <div className="h-8 bg-muted rounded-lg w-full" />
            <div className="h-8 bg-muted rounded-lg w-[85%]" />
            <div className="h-8 bg-muted rounded-lg w-[90%]" />
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="h-4 w-20 bg-muted rounded-full" />
          <div className="space-y-1.5">
            <div className="h-8 bg-muted rounded-lg w-[75%]" />
            <div className="h-8 bg-muted rounded-lg w-[80%]" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-4 border-b border-border shrink-0">
          <div>
            <div className="h-7 w-48 bg-muted rounded-full" />
            <div className="h-4 w-80 bg-muted rounded-full mt-2" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-16 bg-muted rounded-xl hidden sm:block" />
            <div className="h-9 w-32 bg-muted rounded-xl" />
          </div>
        </div>

        {/* Library Sub-Header Skeleton */}
        <div className="h-12 px-6 border-b border-foreground/10 flex items-center justify-between shrink-0 bg-background/50">
          <div className="h-7 w-40 bg-muted rounded-lg" />
          <div className="h-7 w-44 bg-muted rounded-lg" />
        </div>

        {/* Grid Area Skeleton */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border border-border rounded-lg p-2 space-y-3">
                <div className="aspect-square bg-muted rounded-md w-full" />
                <div className="space-y-1.5">
                  <div className="h-3 w-[70%] bg-muted rounded" />
                  <div className="h-3 w-[40%] bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
