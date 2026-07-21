import React from "react"
import { type ShellProps } from "../types"

export function MidnightShell({ children, store }: ShellProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* TODO: Add Header/Navbar here */}
      <header className="p-4 border-b border-zinc-200">
        <h1 className="text-xl font-bold">{store.name}</h1>
      </header>
      
      <main>{children}</main>
    </div>
  )
}
