"use client"

import React, { useEffect } from "react"
import { AlertTriangleIcon } from "@/lib/icons"
import Link from "next/link"

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Storefront Global Error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <AlertTriangleIcon className="w-8 h-8 text-red-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-zinc-900 mb-3 tracking-tight">
        Something went wrong!
      </h2>
      
      <p className="text-zinc-500 max-w-md mb-8 text-sm leading-relaxed">
        We've encountered an unexpected error while loading this page. Our team has been notified.
      </p>
      
      <div className="flex items-center gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          Return Home
        </Link>
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-12 p-4 bg-zinc-100/80 rounded-xl text-left max-w-2xl w-full border border-zinc-200">
          <p className="font-mono text-xs text-red-600 font-semibold mb-2">Developer Details:</p>
          <pre className="font-mono text-xs text-zinc-700 overflow-auto whitespace-pre-wrap">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </div>
      )}
    </div>
  )
}
