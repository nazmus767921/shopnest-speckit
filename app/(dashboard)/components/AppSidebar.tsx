"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboardIcon, LayoutTemplateIcon, ShoppingBagIcon, TagIcon, SettingsIcon, CreditCardIcon, PercentIcon, FolderTreeIcon, FileTextIcon, MenuIcon, GlobeIcon, ExternalLinkIcon, ChevronsUpDownIcon, ChevronRightIcon, ShieldIcon } from "@/lib/icons";

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { LogoutButton } from "./LogoutButton"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  merchant: {
    name: string
    subdomain: string
    subscriptionStatus: string
    trialExpiry: string | Date | null
  } | null
  user: {
    name: string
    email: string
    role?: string | null
  }
  storefrontUrl: string
  storefrontDisplay: string
}

export function AppSidebar({
  merchant,
  user,
  storefrontUrl,
  storefrontDisplay,
}: AppSidebarProps) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  // Storefront group is expanded by default
  const [isStorefrontOpen, setIsStorefrontOpen] = useState(true)

  const storeName = merchant?.name || "Boutique Store"
  const storeInitials = storeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  const userName = user.name || "Merchant"
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  const isAdmin = user.role === "admin"

  // Trial Calculations
  const isTrial = merchant?.subscriptionStatus === "trial"
  const trialExpiry = merchant?.trialExpiry ? new Date(merchant.trialExpiry) : null
  let trialDaysLeft = 0
  let trialProgress = 0
  if (trialExpiry) {
    const diffTime = trialExpiry.getTime() - Date.now()
    trialDaysLeft = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)))
    trialProgress = Math.min(100, Math.max(0, (diffTime / (7 * 1000 * 60 * 60 * 24)) * 100))
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Vercel-Style Unified Switcher Header - Height adjusted to h-14 to match the header */}
      <SidebarHeader className="border-b border-sidebar-border h-14 px-4 flex items-center shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="w-full justify-between hover:bg-sidebar-accent cursor-pointer border border-sidebar-border/60 rounded-none px-3 py-2.5 transition-colors duration-150"
            >
              <div className="flex items-center gap-3 text-left min-w-0 grow">
                <div className="w-8 h-8 rounded-none bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-primary/10">
                  {storeInitials}
                </div>
                <div className="flex flex-col min-w-0 grow">
                  <span className="text-xs font-bold text-sidebar-foreground truncate leading-tight">
                    {storeName}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                    {merchant?.subdomain || "subdomain"}.localhost
                  </span>
                </div>
              </div>
              <ChevronsUpDownIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 p-2 rounded-none border border-sidebar-border bg-popover shadow-md"
            align="start"
            side="bottom"
            sideOffset={6}
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
              Storefront Access
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 cursor-pointer rounded-none text-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              >
                <GlobeIcon className="h-4 w-4 text-primary shrink-0" />
                <span className="grow truncate font-mono text-xs">{storefrontDisplay}</span>
                <ExternalLinkIcon className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
              </a>
            </DropdownMenuItem>

            {isAdmin && (
              <>
                <DropdownMenuSeparator className="my-1 border-sidebar-border" />
                <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                  Platform Control
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 cursor-pointer rounded-none text-sm px-2 py-1.5 hover:bg-red-50 hover:text-red-750 dark:hover:bg-red-950/30 text-red-650 transition-colors duration-150"
                  >
                    <ShieldIcon className="h-4 w-4 shrink-0" />
                    <span className="font-semibold">Super Admin Panel</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      {/* Main Navigation Sidebar Content */}
      <SidebarContent className="px-3 py-4 flex flex-col gap-6 scrollbar-hide flex-1 overflow-y-auto">
        {/* Core Nav Group */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1.5">
            Core
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-none text-sm transition-all duration-150 font-medium",
                    pathname === "/dashboard"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Link href="/dashboard" onClick={handleLinkClick}>
                    <LayoutDashboardIcon className="h-4 w-4 shrink-0" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Storefront Nav Group (Collapsible Accordion - Expanded by default) */}
        <SidebarGroup className="p-0">
          <Collapsible
            open={isStorefrontOpen}
            onOpenChange={setIsStorefrontOpen}
            className="w-full"
          >
            <div className="flex items-center justify-between px-3 mb-1">
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest py-1.5 hover:text-sidebar-foreground cursor-pointer transition-colors duration-150 focus:outline-none">
                  <span>Storefront</span>
                  <ChevronRightIcon
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200 shrink-0",
                      isStorefrontOpen && "rotate-90"
                    )}
                  />
                </button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-1">
              <SidebarMenuSub className="mx-0 border-l border-sidebar-border/80 pl-2 pr-0 py-1 space-y-1">
                {[
                  {
                    label: "Templates",
                    href: "/dashboard/templates",
                    icon: LayoutTemplateIcon,
                  },
                  {
                    label: "Pages",
                    href: "/dashboard/pages",
                    icon: FileTextIcon,
                  },
                  {
                    label: "Navigation",
                    href: "/dashboard/settings/navigation",
                    icon: MenuIcon,
                  },
                  {
                    label: "Products",
                    href: "/dashboard/products",
                    icon: ShoppingBagIcon,
                  },
                  {
                    label: "Categories",
                    href: "/dashboard/categories",
                    icon: FolderTreeIcon,
                  },
                  {
                    label: "Orders",
                    href: "/dashboard/orders",
                    icon: TagIcon,
                  },
                  {
                    label: "Discounts",
                    href: "/dashboard/discounts",
                    icon: PercentIcon,
                  },
                ].map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <SidebarMenuSubItem key={item.href}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 px-3 py-3 rounded-none text-sm transition-all duration-150 font-medium",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary font-bold shadow-xs"
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        <Link href={item.href} onClick={handleLinkClick}>
                          <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Spacer to push Billing to the bottom of the sidebar body */}
        <div className="grow" />

        {/* Billing & Plan aligned bottom of the sidebar */}
        <SidebarGroup className="p-0 pt-4 border-t border-sidebar-border/40">
          <SidebarGroupLabel className="px-3 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1.5">
            Billing
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/billing")}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-none text-sm transition-all duration-150 font-medium",
                    pathname.startsWith("/dashboard/billing")
                      ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Link href="/dashboard/billing" onClick={handleLinkClick}>
                    <CreditCardIcon className="h-4 w-4 shrink-0" />
                    <span>Billing & Plan</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer with Trial Panel and Profile Dropdown */}
      <SidebarFooter className="border-t border-sidebar-border px-4 py-4 flex flex-col gap-4 shrink-0">
        {/* Trial Progress indicator */}
        {isTrial && (
          <div className="border border-amber-500/30 bg-amber-500/5 rounded-none p-3 flex flex-col gap-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-none bg-amber-500 animate-pulse" />
                Free Trial
              </span>
              <span>
                {trialDaysLeft} {trialDaysLeft === 1 ? "Day" : "Days"} Left
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-none overflow-hidden">
              <div
                className="h-full rounded-none bg-amber-600 transition-all duration-500"
                style={{ width: `${trialProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="w-full justify-between hover:bg-sidebar-accent cursor-pointer border border-sidebar-border/40 rounded-none px-3 py-3 transition-colors duration-150"
            >
              <div className="flex items-center gap-3 text-left min-w-0 grow">
                <div className="w-8 h-8 rounded-none bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {userInitials}
                </div>
                <div className="flex flex-col min-w-0 grow">
                  <span className="text-xs font-bold text-sidebar-foreground truncate leading-tight">
                    {userName}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                    Store Owner
                  </span>
                </div>
              </div>
              <ChevronsUpDownIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 cursor-pointer rounded-none text-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              >
                <SettingsIcon className="h-4 w-4 shrink-0" />
                <span>Store SettingsIcon</span>
              </Link>
            </DropdownMenuItem>
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
