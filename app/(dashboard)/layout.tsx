import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { Store, ExternalLink, Globe } from "lucide-react"
import { LogoutButton } from "./components/LogoutButton"
import { SidebarLinks } from "./components/SidebarLinks"
import { MobileBottomNav } from "./components/MobileBottomNav"

import { rootDomain } from "@/lib/config"

import { Suspense } from "react"

export const instant = false

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas-cream text-ink flex flex-col font-sans select-none antialiased">
      {/* Premium Dashboard Navbar */}
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeaderWrapper />
      </Suspense>

      <div className="grow w-full flex flex-col md:flex-row relative">
        {/* Sidebar Navigation - hidden on mobile, on the left edge on desktop */}
        <aside className="hidden md:flex md:w-75 border-r border-hairline-light bg-canvas-light py-8 px-4 flex-col gap-6 shrink-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)]">
          {/* Active Store Indicator */}
          <Suspense fallback={<StoreIndicatorSkeleton />}>
            <ActiveStoreIndicator />
          </Suspense>

          {/* Navigation Groups */}
          <Suspense fallback={<SidebarLinksSkeleton />}>
            <SidebarLinks />
          </Suspense>


          {/* Trial & Footer Panel */}
          <div className="border-t border-hairline-light pt-6 flex flex-col gap-4">
            <Suspense fallback={<TrialPanelSkeleton />}>
              <TrialPanelWrapper />
            </Suspense>

            <LogoutButton />
          </div>
        </aside>

        {/* Content View - placed second in markup to position on the right on desktop layout */}
        <main className="grow py-10 px-6 md:px-10 pb-24 md:pb-10 bg-canvas-cream/20">
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
    <header className="border-b border-hairline-light bg-canvas-light/75 backdrop-blur-xl px-6 py-3 sticky top-0 z-50 transition-all duration-200">
      <div className="w-full flex items-center justify-between">
        {/* Brand Block */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 bg-zinc-950 text-white rounded-xl flex items-center justify-center shrink-0">
            <Store className="h-5 w-5 stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-heading-md tracking-tight font-bold text-ink leading-none">
              Shop<span className="text-emerald-800 font-medium">Nest</span>
            </span>
            <span className="text-[10px] font-bold tracking-[0.15em] text-shade-45 uppercase mt-0.5">
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
                className="hidden md:flex items-center gap-2 text-caption font-semibold bg-zinc-50 border border-hairline-light hover:bg-zinc-100 hover:border-shade-30 text-shade-60 hover:text-ink rounded-full px-4 py-1.5 transition-all duration-200 group cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <Globe className="h-3.5 w-3.5 text-shade-40 group-hover:text-emerald-700 transition-colors duration-200" />
                <span className="font-mono text-micro tracking-tight">{storefrontDisplay}</span>
                <ExternalLink className="h-3 w-3 text-shade-40 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </a>
            )
          })()}

          {/* Account profile stack */}
          <div className="flex items-center gap-3 pl-4 border-l border-hairline-light">
            <div className="flex-col text-right hidden sm:flex">
              <span className="text-caption font-bold text-ink leading-tight">
                {userName}
              </span>
              <span className="text-[10px] text-shade-40 font-semibold uppercase tracking-wider leading-none mt-0.5">
                Store Owner
              </span>
            </div>
            <div className="w-8.5 h-8.5 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-caption border border-zinc-900 transition-transform duration-200 hover:scale-105 select-none shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
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
    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 border border-hairline-light/80 rounded-2xl transition-colors duration-250 cursor-default select-none">
      <div className="w-10 h-10 bg-zinc-950 text-white rounded-xl flex items-center justify-center font-bold text-caption shrink-0">
        {storeInitials}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider leading-none">
          Currently Managing
        </span>
        <span className="text-caption font-bold text-ink truncate mt-1 leading-tight">
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

  // Calculate Trial details
  const isTrial = merchant?.subscriptionStatus === "trial"
  const trialExpiry = merchant?.trialExpiry ? new Date(merchant.trialExpiry) : null
  let trialDaysLeft = 0
  let trialProgress = 0
  if (trialExpiry) {
    const diffTime = trialExpiry.getTime() - Date.now()
    trialDaysLeft = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)))
    // Continuous progress bar out of 7 days
    trialProgress = Math.min(100, Math.max(0, (diffTime / (7 * 1000 * 60 * 60 * 24)) * 100))
  }

  // Determine semantic styling based on trial days left (emerald, amber, red)
  let cardBg = "bg-emerald-50"
  let borderClass = "border-emerald-200/60"
  let textClass = "text-emerald-900"
  let barBg = "bg-emerald-800"
  let dotBg = "bg-emerald-700"
  let textBadge = "text-emerald-800"

  if (trialDaysLeft <= 1) {
    cardBg = "bg-red-50"
    borderClass = "border-red-200/60"
    textClass = "text-red-900"
    barBg = "bg-red-600"
    dotBg = "bg-red-600"
    textBadge = "text-red-800"
  } else if (trialDaysLeft <= 3) {
    cardBg = "bg-amber-50"
    borderClass = "border-amber-200/60"
    textClass = "text-amber-900"
    barBg = "bg-amber-600"
    dotBg = "bg-amber-600"
    textBadge = "text-amber-800"
  }

  if (!isTrial) return null

  return (
    <div className={`${cardBg} p-4 border ${borderClass} rounded-2xl flex flex-col gap-2.5`}>
      <div className="flex items-center justify-between">
        <span className={`text-caption font-bold ${textClass} flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotBg} animate-pulse`} />
          Free Trial
        </span>
        <span className={`text-micro font-semibold ${textBadge}`}>
          {trialDaysLeft} {trialDaysLeft === 1 ? "Day" : "Days"} Left
        </span>
      </div>
      <div className="h-1.5 w-full bg-shade-30 rounded-full overflow-hidden">
        <div
          className={`h-full ${barBg} rounded-full transition-all duration-500`}
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

  // Calculate Trial details
  const isTrial = merchant?.subscriptionStatus === "trial"
  const trialExpiry = merchant?.trialExpiry ? new Date(merchant.trialExpiry) : null
  let trialDaysLeft = 0
  let trialProgress = 0
  if (trialExpiry) {
    const diffTime = trialExpiry.getTime() - Date.now()
    trialDaysLeft = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)))
    // Continuous progress bar out of 7 days
    trialProgress = Math.min(100, Math.max(0, (diffTime / (7 * 1000 * 60 * 60 * 24)) * 100))
  }

  // Determine semantic styling based on trial days left (emerald, amber, red)
  let cardBg = "bg-emerald-50"
  let borderClass = "border-emerald-200/60"
  let textClass = "text-emerald-900"
  let barBg = "bg-emerald-800"
  let dotBg = "bg-emerald-700"
  let textBadge = "text-emerald-800"

  if (trialDaysLeft <= 1) {
    cardBg = "bg-red-50"
    borderClass = "border-red-200/60"
    textClass = "text-red-900"
    barBg = "bg-red-600"
    dotBg = "bg-red-600"
    textBadge = "text-red-800"
  } else if (trialDaysLeft <= 3) {
    cardBg = "bg-amber-50"
    borderClass = "border-amber-200/60"
    textClass = "text-amber-900"
    barBg = "bg-amber-600"
    dotBg = "bg-amber-600"
    textBadge = "text-amber-800"
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
    <header className="border-b border-hairline-light bg-canvas-light px-6 py-3.5 sticky top-0 z-50 animate-pulse">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-5 bg-shade-30 rounded-lg w-5 h-5" />
          <div className="h-6 w-32 bg-shade-30 rounded-full" />
        </div>
        <div className="flex items-center gap-6">
          <div className="h-8 w-40 bg-shade-30 rounded-full hidden md:block" />
          <div className="h-9 w-9 bg-shade-30 rounded-full" />
        </div>
      </div>
    </header>
  )
}

function StoreIndicatorSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 px-3 py-2 bg-canvas-cream/50 rounded-lg border border-hairline-light/60 animate-pulse">
      <div className="h-3 w-28 bg-shade-30 rounded-full" />
      <div className="h-4.5 w-36 bg-shade-30 rounded-full" />
    </div>
  )
}

function TrialPanelSkeleton() {
  return (
    <div className="p-4 border border-shade-30 rounded-lg bg-shade-30/10 animate-pulse flex flex-col gap-2.5">
      <div className="flex justify-between">
        <div className="h-3.5 w-16 bg-shade-30 rounded-full" />
        <div className="h-3 w-12 bg-shade-30 rounded-full" />
      </div>
      <div className="h-1.5 w-full bg-shade-30 rounded-full" />
    </div>
  )
}

function MobileBottomNavSkeleton() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-canvas-light border-t border-hairline-light animate-pulse flex justify-around items-center z-50">
      <div className="h-10 w-10 bg-shade-30 rounded-full" />
      <div className="h-10 w-10 bg-shade-30 rounded-full" />
      <div className="h-10 w-10 bg-shade-30 rounded-full" />
    </div>
  )
}

function SidebarLinksSkeleton() {
  return (
    <div className="flex flex-col gap-5 grow animate-pulse">
      <div className="flex flex-col gap-1">
        <div className="h-3 w-16 bg-shade-20 rounded mb-2 ml-3" />
        <div className="h-10 bg-shade-20 rounded-full w-full mb-1" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-3 w-20 bg-shade-20 rounded mb-2 ml-3" />
        <div className="h-10 bg-shade-20 rounded-full w-full mb-1" />
        <div className="h-10 bg-shade-20 rounded-full w-full mb-1" />
        <div className="h-10 bg-shade-20 rounded-full w-full mb-1" />
      </div>
    </div>
  )
}
