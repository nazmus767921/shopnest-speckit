import React from "react"
import { ShieldAlertIcon } from "@/lib/icons"

export default function BlockedPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-gray-150 rounded-2xl shadow-sm p-8 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
          <ShieldAlertIcon className="h-8 w-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Access Restricted</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your IP address has been restricted from accessing this online storefront. If you believe this is in error, please contact support or the store administrator.
          </p>
        </div>
        <div className="w-full h-px bg-gray-100" />
        <div className="text-xs font-mono text-gray-400">
          Error Code: 403 Forbidden
        </div>
      </div>
    </main>
  )
}
