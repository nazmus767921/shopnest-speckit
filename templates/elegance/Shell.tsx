import React from "react"
import type { ShellProps } from "../types"
import { EleganceNavbar } from "./EleganceNavbar"
// TODO: migrate to new FooterSection or restore EleganceFooter

export function Shell({ store, menus, categories, themeVars, children }: ShellProps) {
  return (
    <div className="storefront-template-elegance min-h-screen flex flex-col" style={themeVars as React.CSSProperties}>
      <EleganceNavbar store={store} subdomain={store.subdomain} menu={menus.main} categories={categories} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
