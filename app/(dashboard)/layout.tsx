import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { Suspense } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./components/AppSidebar"

export const instant = false

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="theme-compact-sharp flex min-h-screen w-full bg-background text-foreground select-none antialiased">
        {/* Sidebar Component */}
        <Suspense fallback={<SidebarSkeleton />}>
          <DashboardSidebarWrapper />
        </Suspense>

        {/* Content View */}
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <Suspense fallback={<HeaderSkeleton />}>
            <DashboardHeaderWrapper />
          </Suspense>

          <main className="grow py-8 px-4 md:px-8 pb-10 bg-muted/10">
            <div className="w-full">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

async function DashboardSidebarWrapper() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) return null

  const merchant = await getMerchantByOwnerId(session.user.id)

  const isDev = process.env.NODE_ENV === "development"
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "shopnest.com.bd"
  const storefrontUrl = merchant
    ? (isDev ? `http://${merchant.subdomain}.localhost:3000` : `https://${merchant.subdomain}.${rootDomain}`)
    : "#"
  const storefrontDisplay = merchant ? `${merchant.subdomain}.${rootDomain}` : ""

  return (
    <AppSidebar
      merchant={merchant || null}
      user={session.user}
      storefrontUrl={storefrontUrl}
      storefrontDisplay={storefrontDisplay}
    />
  )
}

async function DashboardHeaderWrapper() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null

  return (
    <header className="border-b border-border/80 bg-background h-14 px-4 sticky top-0 z-40 flex items-center justify-between text-foreground shrink-0">
      <div className="flex items-center gap-3">
        {/* Sidebar trigger toggle button - sharp corners */}
        <SidebarTrigger className="h-9 w-9 border border-border/60 bg-background hover:bg-muted shadow-2xs cursor-pointer rounded-none flex items-center justify-center" />
        
        <div className="h-4 w-[1px] bg-border/60 mx-1 hidden md:block" />

        {/* Brand Block */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-foreground">
            {merchant?.name || "Boutique Store"}
          </span>
          <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase bg-muted/80 px-2 py-0.5 rounded-none border border-border/40">
            Merchant Panel
          </span>
        </div>
      </div>
    </header>
  )
}

function HeaderSkeleton() {
  return (
    <header className="border-b border-border/80 bg-background h-14 px-4 sticky top-0 z-40 animate-pulse flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 bg-muted rounded-none" />
        <div className="h-4.5 w-32 bg-muted rounded-none" />
      </div>
    </header>
  )
}

function SidebarSkeleton() {
  return (
    <aside className="w-64 border-r border-border bg-card p-4 flex flex-col gap-6 h-screen sticky top-0 shrink-0">
      <div className="h-10 bg-muted rounded-none animate-pulse" />
      <div className="flex-1 flex flex-col gap-4 mt-4">
        <div className="h-3 w-12 bg-muted rounded-none animate-pulse ml-2" />
        <div className="h-10 bg-muted rounded-none animate-pulse" />
        <div className="h-3 w-16 bg-muted rounded-none animate-pulse ml-2 mt-4" />
        <div className="h-10 bg-muted rounded-none animate-pulse" />
        <div className="h-10 bg-muted rounded-none animate-pulse" />
      </div>
    </aside>
  )
}
