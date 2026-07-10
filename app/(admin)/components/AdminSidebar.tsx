"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Shield,
  Users,
  CreditCard,
  Layers,
  LayoutTemplate,
  ChevronsUpDown,
  LayoutDashboard,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogoutButton } from "../../(dashboard)/components/LogoutButton"
import { cn } from "@/lib/utils"

interface AdminSidebarProps {
  user: {
    name: string
    email: string
  }
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const userName = user.name || "Admin"
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const links = [
    {
      label: "Overview",
      href: "/admin",
      icon: Shield,
      exact: true,
    },
    {
      label: "Merchants",
      href: "/admin/merchants",
      icon: Users,
    },
    {
      label: "Subscriptions",
      href: "/admin/subscriptions",
      icon: CreditCard,
    },
    {
      label: "Subscription Plans",
      href: "/admin/plans",
      icon: Layers,
    },
    {
      label: "Templates",
      href: "/admin/templates",
      icon: LayoutTemplate,
    },
  ]

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Vercel-Style Admin Header - h-14 to match the header border */}
      <SidebarHeader className="border-b border-sidebar-border h-14 px-4 flex items-center shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="w-full justify-between hover:bg-sidebar-accent cursor-pointer border border-sidebar-border/60 rounded-none px-3 py-2.5 transition-colors duration-150"
            >
              <div className="flex items-center gap-3 text-left min-w-0 grow">
                <div className="w-8 h-8 rounded-none bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-sm border border-zinc-900">
                  <Shield className="h-4.5 w-4.5 text-red-500 fill-red-500/10 stroke-[2]" />
                </div>
                <div className="flex flex-col min-w-0 grow">
                  <span className="text-xs font-bold text-sidebar-foreground truncate leading-none">
                    ShopNest
                  </span>
                  <span className="text-[10px] text-red-650 font-bold uppercase tracking-wider mt-1.5">
                    Super Admin
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 p-2 rounded-none border border-sidebar-border bg-popover shadow-md"
            align="start"
            side="bottom"
            sideOffset={6}
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
              Navigation Shortcut
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 cursor-pointer rounded-none text-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              >
                <LayoutDashboard className="h-4 w-4 text-primary shrink-0" />
                <span className="grow truncate font-semibold">Merchant Dashboard</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      {/* Main Admin Sidebar Links */}
      <SidebarContent className="px-3 py-4 flex flex-col gap-6 scrollbar-hide flex-1 overflow-y-auto">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1.5">
            Core Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-none text-sm transition-all duration-150 font-medium",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-red-500 font-bold shadow-xs"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <Link href={item.href} onClick={handleLinkClick}>
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-red-500" : "text-muted-foreground"
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Profile Dropdown */}
      <SidebarFooter className="border-t border-sidebar-border px-4 py-4 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="w-full justify-between hover:bg-sidebar-accent cursor-pointer border border-sidebar-border/40 rounded-none px-3 py-3 transition-colors duration-150"
            >
              <div className="flex items-center gap-3 text-left min-w-0 grow">
                <div className="w-8 h-8 rounded-none bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-zinc-900">
                  {userInitials}
                </div>
                <div className="flex flex-col min-w-0 grow">
                  <span className="text-xs font-bold text-sidebar-foreground truncate leading-tight">
                    {userName}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                    Platform Admin
                  </span>
                </div>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 p-2 rounded-none border border-sidebar-border bg-popover shadow-md"
            align="start"
            side="top"
            sideOffset={6}
          >
            <div className="px-2 py-1.5 min-w-0">
              <p className="text-xs font-bold text-sidebar-foreground truncate leading-tight">
                {userName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {user.email}
              </p>
            </div>
            <DropdownMenuSeparator className="my-1 border-sidebar-border" />
            <div className="p-1">
              <LogoutButton />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
