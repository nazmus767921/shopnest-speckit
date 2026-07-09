import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { Store, ExternalLink, Globe } from "lucide-react"
import { LogoutButton } from "./components/LogoutButton"
import { SidebarLinks } from "./components/SidebarLinks"
import { MobileBottomNav } from "./components/MobileBottomNav"
import { cn } from "@/lib/utils"

import { rootDomain } from "@/lib/config"

import { Suspense } from "react"

export const instant = false

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none antialiased">
      {/* Premium Dashboard Navbar */}
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeaderWrapper />
      </Suspense>

      <div className="grow w-full flex flex-col md:flex-row relative">
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex md:w-75 border-r border-border bg-card py-8 px-4 flex-col gap-6 shrink-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)]">
          {/* Active Store Indicator */}
          <Suspense fallback={<StoreIndicatorSkeleton />}>
            <ActiveStoreIndicator />
          </Suspense>

          {/* Navigation Groups */}
          <Suspense fallback={<SidebarLinksSkeleton />}>
            <SidebarLinks />
          </Suspense>

          {/* Trial & Footer Panel */}
          <div className="border-t border-border pt-6 flex flex-col gap-4">
            <Suspense fallback={<TrialPanelSkeleton />}>
              <TrialPanelWrapper />
            </Suspense>

            <LogoutButton />
          </div>
        </aside>

        {/* Content View */}
        <main className="grow py-10 px-6 md:px-10 pb-24 md:pb-10 bg-muted/10">
          <div className="w-full">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <Suspense fallback={<MobileBottomNavSkeleton />}>
        <DashboardMobileBottomNavWrapper />
      </Suspense>
    </div>
  )
}

async function DashboardHeaderWrapper() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null

  const userName = session?.user?.name || "Merchant"
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  return (
    <header className="border-b border-border bg-card/75 backdrop-blur-xl px-6 py-3 sticky top-0 z-50 transition-all duration-200 text-foreground">
      <div className="w-full flex items-center justify-between">
        {/* Brand Block */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shrink-0">
            <Store className="h-5 w-5 stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base tracking-tight font-bold text-foreground leading-none">
              Shop<span className="text-primary font-medium">Nest</span>
            </span>
            <span className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase mt-0.5">
              Boutique Suite
            </span>
          </div>
        </div>

        {/* Center & Right Navigation controls */}
        <div className="flex items-center gap-6">
          {merchant && (() => {
            const isDev = process.env.NODE_ENV === "development"
            const storefrontUrl = isDev
              ? `http://${merchant.subdomain}.localhost:3000`
              : `https://${merchant.subdomain}.${rootDomain}`
            const storefrontDisplay = `${merchant.subdomain}.${rootDomain}`
            return (
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 text-sm font-semibold bg-muted border border-border hover:bg-muted/80 hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground rounded-full px-4 py-1.5 transition-all duration-205 group cursor-pointer shadow-sm"
              >
                <Globe className="h-3.5 w-3.5 text-muted-foreground/80 group-hover:text-primary transition-colors duration-200" />
                <span className="font-mono text-xs tracking-tight">{storefrontDisplay}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </a>
            )
          })()}

          {/* Account profile stack */}
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="flex-col text-right hidden sm:flex">
              <span className="text-sm font-bold text-foreground leading-tight">
                {userName}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-none mt-0.5">
                Store Owner
              </span>
            </div>
            <div className="w-8.5 h-8.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm border border-border/10 transition-transform duration-200 hover:scale-105 select-none shadow-sm">
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

async function ActiveStoreIndicator() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null
  const storeName = merchant?.name || "Boutique Store"
  const storeInitials = storeName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border border-border rounded-xl transition-colors duration-250 cursor-default select-none text-foreground">
      <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
        {storeInitials}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
          Currently Managing
        </span>
        <span className="text-sm font-bold text-foreground truncate mt-1 leading-tight">
          {storeName}
        </span>
      </div>
    </div>
  )
}

async function TrialPanelWrapper() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null

  const isTrial = merchant?.subscriptionStatus === "trial"
  const trialExpiry = merchant?.trialExpiry ? new Date(merchant.trialExpiry) : null
  let trialDaysLeft = 0
  let trialProgress = 0
  if (trialExpiry) {
    const diffTime = trialExpiry.getTime() - Date.now()
    trialDaysLeft = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)))
    trialProgress = Math.min(100, Math.max(0, (diffTime / (7 * 1000 * 60 * 60 * 24)) * 100))
  }

  let cardBg = "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20"
  let textClass = "text-emerald-800 dark:text-emerald-300"
  let barBg = "bg-emerald-600"
  let dotBg = "bg-emerald-500"
  let textBadge = "text-emerald-700 dark:text-emerald-400"

  if (trialDaysLeft <= 1) {
    cardBg = "bg-destructive/10 text-destructive border-destructive/20"
    textClass = "text-destructive"
    barBg = "bg-destructive"
    dotBg = "bg-destructive"
    textBadge = "text-destructive"
  } else if (trialDaysLeft <= 3) {
    cardBg = "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20"
    textClass = "text-amber-800 dark:text-amber-300"
    barBg = "bg-amber-600"
    dotBg = "bg-amber-500"
    textBadge = "text-amber-700 dark:text-amber-400"
  }

  if (!isTrial) return null

  return (
    <div className={cn(cardBg, "p-4 border rounded-xl flex flex-col gap-2.5")}>
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-bold flex items-center gap-1.5", textClass)}>
          <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dotBg)} />
          Free Trial
        </span>
        <span className={cn("text-xs font-semibold", textBadge)}>
          {trialDaysLeft} {trialDaysLeft === 1 ? "Day" : "Days"} Left
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barBg)}
          style={{ width: `${trialProgress}%` }}
        />
      </div>
    </div>
  )
}

async function DashboardMobileBottomNavWrapper() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null
  const storeName = merchant?.name || "Boutique Store"

  const isTrial = merchant?.subscriptionStatus === "trial"
  const trialExpiry = merchant?.trialExpiry ? new Date(merchant.trialExpiry) : null
  let trialDaysLeft = 0
  let trialProgress = 0
  if (trialExpiry) {
    const diffTime = trialExpiry.getTime() - Date.now()
    trialDaysLeft = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)))
    trialProgress = Math.min(100, Math.max(0, (diffTime / (7 * 1000 * 60 * 60 * 24)) * 100))
  }

  let cardBg = "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20"
  let borderClass = "border-emerald-500/20"
  let textClass = "text-emerald-800 dark:text-emerald-300"
  let barBg = "bg-emerald-600"
  let dotBg = "bg-emerald-500"
  let textBadge = "text-emerald-700 dark:text-emerald-400"

  if (trialDaysLeft <= 1) {
    cardBg = "bg-destructive/10 text-destructive border-destructive/20"
    borderClass = "border-destructive/20"
    textClass = "text-destructive"
    barBg = "bg-destructive"
    dotBg = "bg-destructive"
    textBadge = "text-destructive"
  } else if (trialDaysLeft <= 3) {
    cardBg = "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20"
    borderClass = "border-amber-500/20"
    textClass = "text-amber-800 dark:text-amber-300"
    barBg = "bg-amber-600"
    dotBg = "bg-amber-500"
    textBadge = "text-amber-700 dark:text-amber-400"
  }

  return (
    <MobileBottomNav
      storeName={storeName}
      isTrial={isTrial}
      trialDaysLeft={trialDaysLeft}
      trialProgress={trialProgress}
      trialStyles={{ cardBg, borderClass, textClass, barBg, dotBg, textBadge }}
    />
  )
}

function HeaderSkeleton() {
  return (
    <header className="border-b border-border bg-card px-6 py-3.5 sticky top-0 z-50 animate-pulse">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-5 bg-muted rounded-lg w-5 h-5" />
          <div className="h-6 w-32 bg-muted rounded-full" />
        </div>
        <div className="flex items-center gap-6">
          <div className="h-8 w-40 bg-muted rounded-full hidden md:block" />
          <div className="h-9 w-9 bg-muted rounded-full" />
        </div>
      </div>
    </header>
  )
}

function StoreIndicatorSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 px-3 py-2 bg-muted/50 rounded-lg border border-border animate-pulse">
      <div className="h-3 w-28 bg-muted rounded-full" />
      <div className="h-4.5 w-36 bg-muted rounded-full" />
    </div>
  )
}

function TrialPanelSkeleton() {
  return (
    <div className="p-4 border border-border rounded-lg bg-muted/10 animate-pulse flex flex-col gap-2.5">
      <div className="flex justify-between">
        <div className="h-3.5 w-16 bg-muted rounded-full" />
        <div className="h-3 w-12 bg-muted rounded-full" />
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full" />
    </div>
  )
}

function MobileBottomNavSkeleton() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border animate-pulse flex justify-around items-center z-50">
      <div className="h-10 w-10 bg-muted rounded-full" />
      <div className="h-10 w-10 bg-muted rounded-full" />
      <div className="h-10 w-10 bg-muted rounded-full" />
    </div>
  )
}

function SidebarLinksSkeleton() {
  return (
    <div className="flex flex-col gap-5 grow animate-pulse">
      <div className="flex flex-col gap-1">
        <div className="h-3 w-16 bg-muted rounded mb-2 ml-3" />
        <div className="h-10 bg-muted rounded-lg w-full mb-1" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-3 w-20 bg-muted rounded mb-2 ml-3" />
        <div className="h-10 bg-muted rounded-lg w-full mb-1" />
        <div className="h-10 bg-muted rounded-lg w-full mb-1" />
        <div className="h-10 bg-muted rounded-lg w-full mb-1" />
      </div>
    </div>
  )
}
