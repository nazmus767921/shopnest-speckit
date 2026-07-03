"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth/auth-client"
import { LogOut } from "lucide-react"

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
      // Fallback
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-caption font-semibold text-red-650 hover:bg-red-50/75 cursor-pointer text-left focus:outline-none transition-all duration-200"
    >
      <LogOut className="h-4 w-4" />
      Log Out
    </button>
  )
}
