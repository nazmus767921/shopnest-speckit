import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "./components/AdminSidebar"
import { Suspense } from "react"

type Props = {
  children: React.ReactNode
}

export const instant = false

export default function AdminLayout({ children }: Props) {
  return (
    <div className="theme-compact-sharp">
      <Suspense fallback={<AdminLayoutSkeleton />}>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </Suspense>
    </div>
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

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-canvas-cream text-ink flex w-full font-sans select-none antialiased">
        {/* Admin Sidebar */}
        <AdminSidebar user={session.user} />

        {/* Content View */}
        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-canvas-cream">
          {/* Header */}
          <header className="border-b border-hairline-light bg-canvas-light h-14 px-4 sticky top-0 z-40 flex items-center justify-between text-ink transition-all duration-200 shrink-0">
            <div className="flex items-center gap-3">
              {/* Sidebar trigger toggle button - sharp corners */}
              <SidebarTrigger className="h-9 w-9 border border-hairline-light bg-canvas-light hover:bg-canvas-cream/50 shadow-2xs cursor-pointer rounded-none flex items-center justify-center" />
              
              <div className="h-4 w-[1px] bg-hairline-light mx-1 hidden md:block" />

              {/* Brand Block */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-ink">
                  ShopNest Admin
                </span>
                <span className="text-[9px] font-bold tracking-wider text-red-600 uppercase bg-red-50 border border-red-100 px-2 py-0.5 rounded-none">
                  Super Admin
                </span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="grow py-8 px-4 md:px-8 pb-10 bg-canvas-cream/30">
            <div className="w-full max-w-7xl mx-auto">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

function AdminLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-canvas-cream text-ink flex flex-col font-sans animate-pulse">
      <header className="border-b border-hairline-light bg-canvas-light h-14 px-4 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-shade-30 rounded-none" />
          <div className="h-4.5 w-32 bg-shade-30 rounded-none" />
        </div>
      </header>
      <div className="grow w-full flex flex-col md:flex-row">
        <aside className="hidden md:flex md:w-75 border-r border-hairline-light bg-canvas-light py-6 px-4 flex-col gap-6">
          <div className="h-4 w-24 bg-shade-30 rounded-none" />
          <div className="h-40 bg-shade-30 rounded-none" />
        </aside>
        <main className="grow py-10 px-8 bg-canvas-cream/30">
          <div className="h-60 bg-shade-30 rounded-none" />
        </main>
      </div>
    </div>
  )
}
