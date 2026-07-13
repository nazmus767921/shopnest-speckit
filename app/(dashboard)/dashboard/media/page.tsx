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
      <div className="w-[220px] border-r border-foreground/5 bg-background p-4 flex flex-col gap-6 hidden md:flex shrink-0 h-full">
        {/* Library Section */}
        <div>
          <div className="h-3 w-16 bg-muted/60 rounded mb-3 mx-3" />
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 px-3 rounded-lg flex items-center justify-between bg-muted/5">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted/50 rounded" />
                  <div className={`h-4 bg-muted/60 rounded ${i === 0 ? 'w-16' : i === 1 ? 'w-12' : 'w-14'}`} />
                </div>
                <div className="h-4 w-6 bg-muted/40 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Folders Section */}
        <div>
          <div className="flex items-center justify-between mb-3 mx-3">
            <div className="h-3 w-14 bg-muted/60 rounded" />
            <div className="h-4 w-4 bg-muted/50 rounded" />
          </div>
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 px-3 rounded-lg flex items-center justify-between bg-muted/5">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted/50 rounded" />
                  <div className={`h-4 bg-muted/60 rounded ${i === 0 ? 'w-20' : i === 1 ? 'w-16' : 'w-24'}`} />
                </div>
                <div className="h-4 w-6 bg-muted/40 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative border-r border-foreground/5 h-full overflow-hidden w-full">
        {/* Top Page Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4 px-6 border-b border-border shrink-0 bg-background">
          <div>
            <div className="h-7 w-36 md:h-8 md:w-44 bg-muted/60 rounded" />
            <div className="h-3.5 w-64 md:w-96 bg-muted/40 rounded mt-2" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="h-9 w-18 bg-muted/40 rounded-xl hidden md:block" />
            <div className="h-9 bg-muted/60 rounded-xl flex-1 md:flex-initial md:w-32" />
          </div>
        </div>

        {/* Sub-Header Toolbar Skeleton */}
        <div className="px-4 py-2.5 md:px-6 md:py-0 md:h-12 border-b border-foreground/10 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 shrink-0 bg-background/95 backdrop-blur z-10 w-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-5 md:gap-6 h-10 md:h-12">
              <div className="flex items-center gap-2 h-full border-b-2 border-primary">
                <div className="h-3.5 w-3.5 bg-muted/60 rounded" />
                <div className="h-3.5 w-12 bg-muted/60 rounded" />
              </div>
              <div className="flex items-center gap-2 h-full border-b-2 border-transparent">
                <div className="h-3.5 w-3.5 bg-muted/40 rounded" />
                <div className="h-3.5 w-20 bg-muted/40 rounded" />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-1.5 ml-2">
              <div className="h-4 w-16 bg-muted/30 rounded" />
              <div className="h-4 w-12 bg-muted/30 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="h-8 md:h-7 bg-muted/20 border border-foreground/10 rounded-md flex-1 md:w-40" />
            <div className="h-8 w-8 md:h-7 md:w-7 bg-muted/30 border border-foreground/10 rounded-md shrink-0" />
          </div>
        </div>

        {/* Grid Area Skeleton */}
        <div className="flex-1 p-4 overflow-y-auto min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 w-full">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="border border-foreground/10 bg-background rounded-lg flex flex-col overflow-hidden shadow-sm">
                <div className="aspect-square bg-muted/20 w-full border-b border-foreground/10" />
                <div className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3 bg-muted/50 rounded w-[70%]" />
                    <div className="h-2.5 bg-muted/30 rounded w-[40%] mt-1" />
                  </div>
                  <div className="h-6 w-6 bg-muted/30 rounded shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
