"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth/auth-client"
import { LogOutIcon } from "@/lib/icons";

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login")
            router.refresh()
          },
        },
      })
    } catch (error) {
      console.error("Failed to log out:", error)
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-250 dark:border-red-900/40 bg-red-50/45 text-red-650 hover:bg-red-600 hover:text-white dark:bg-red-950/15 dark:hover:bg-red-900 dark:text-red-400 dark:hover:text-white transition-colors duration-150 text-xs font-bold cursor-pointer rounded-none focus:outline-none"
    >
      <LogOutIcon className="h-3.5 w-3.5 shrink-0" />
      <span>Log Out</span>
    </button>
  )
}
