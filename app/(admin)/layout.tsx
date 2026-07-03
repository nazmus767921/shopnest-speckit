import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { Shield, UserCircle, LogOut, Users, CreditCard } from "lucide-react"
import Link from "next/link"
import { LogoutButton } from "../(dashboard)/components/LogoutButton"
import { AdminMobileBottomNav } from "./components/AdminMobileBottomNav"
import { AdminSidebarLinks } from "./components/AdminSidebarLinks"

type Props = {
  children: React.ReactNode
}

import { Suspense } from "react"

export const instant = false

export default function AdminLayout({ children }: Props) {
  return (
    <Suspense fallback={<AdminLayoutSkeleton />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  )
}

async function AdminLayoutContent({ children }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const hasSession = !!session?.user
  const has2FA = session?.user?.twoFactorEnabled === true

  // If not authenticated or 2FA is pending setup, render the login/setup cards directly
  if (!hasSession || !has2FA) {
    return <>{children}</>
  }

  const adminName = session.user.name || "Admin"
  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  return (
    <div className="min-h-screen bg-canvas-cream text-ink flex flex-col font-sans">
      <header className="border-b border-hairline-light bg-canvas-light/75 backdrop-blur-xl px-6 py-3 sticky top-0 z-50 transition-all duration-200">
        <div className="w-full flex items-center justify-between">
          {/* Brand Block */}
          <div className="flex items-center gap-3 select-none">
            <div className="w-10 h-10 bg-zinc-950 text-white rounded-xl flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-red-500 fill-red-500/10 stroke-[2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-heading-md tracking-tight font-bold text-ink leading-none">
                Shop<span className="text-emerald-800 font-medium">Nest</span>
              </span>
              <span className="text-[10px] font-bold tracking-[0.15em] text-red-600 uppercase mt-0.5">
                Super Admin
              </span>
            </div>
          </div>

          {/* Right Navigation controls */}
          <div className="flex items-center gap-6">
            <span className="text-micro bg-red-50 text-red-700 rounded-full px-3 py-1 font-semibold border border-red-100 uppercase tracking-wide select-none">
              Platform Admin
            </span>

            {/* Account profile stack */}
            <div className="flex items-center gap-3 pl-4 border-l border-hairline-light">
              <div className="flex-col text-right hidden sm:flex">
                <span className="text-caption font-bold text-ink leading-tight">
                  {adminName}
                </span>
                <span className="text-[10px] text-shade-40 font-semibold uppercase tracking-wider leading-none mt-0.5">
                  Platform Admin
                </span>
              </div>
              <div className="w-8.5 h-8.5 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-caption border border-zinc-900 transition-transform duration-200 hover:scale-105 select-none shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                {initials}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grow w-full flex flex-col md:flex-row">
        {/* Sidebar Navigation - hidden on mobile, on the left edge on desktop */}
        <aside className="hidden md:flex md:w-75 border-r border-hairline-light bg-canvas-light py-6 px-4 flex-col gap-6 shrink-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)]">
          <div className="px-3 mb-2">
            <span className="text-eyebrow-cap font-semibold text-shade-40 uppercase tracking-wider block">
              Core Admin
            </span>
          </div>
          <AdminSidebarLinks />
          <div className="mt-auto border-t border-hairline-light pt-4 flex flex-col gap-1">
            <LogoutButton />
          </div>
        </aside>

        {/* Content View - placed second in markup to position on the right on desktop layout */}
        <main className="grow py-10 px-8 pb-24 md:pb-10 bg-canvas-cream/30 w-full">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <AdminMobileBottomNav adminName={session.user.name ?? "Admin"} />
    </div>
  )
}

function AdminLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-canvas-cream text-ink flex flex-col font-sans animate-pulse">
      <header className="border-b border-hairline-light bg-canvas-light px-6 py-4 sticky top-0 z-50">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-shade-30 rounded-full" />
            <div className="h-6 w-48 bg-shade-30 rounded-full" />
          </div>
          <div className="h-6 w-32 bg-shade-30 rounded-full" />
        </div>
      </header>
      <div className="grow w-full flex flex-col md:flex-row">
        <aside className="hidden md:flex md:w-75 border-r border-hairline-light bg-canvas-light py-6 px-4 flex-col gap-6">
          <div className="h-4 w-24 bg-shade-30 rounded-full" />
          <div className="h-40 bg-shade-30 rounded-lg" />
        </aside>
        <main className="grow py-10 px-8 bg-canvas-cream/30">
          <div className="h-60 bg-shade-30 rounded-lg" />
        </main>
      </div>
    </div>
  )
}

