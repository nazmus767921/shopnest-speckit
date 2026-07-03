"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { AlertOctagon } from "lucide-react"

export default function StoreSuspendedPage() {
  const [mainUrl, setMainUrl] = useState("/")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      const protocol = window.location.protocol
      const port = window.location.port

      if (hostname.endsWith("localhost")) {
        setMainUrl(`${protocol}//localhost:${port || "3000"}`)
      } else {
        const parts = hostname.split(".")
        if (parts.length > 2) {
          const rootDomain = parts.slice(-3).join(".")
          setMainUrl(`${protocol}//${rootDomain}`)
        } else {
          setMainUrl("/")
        }
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-canvas-cream flex flex-col justify-center items-center px-6 text-ink select-none animate-fade-in">
      <div className="flex flex-col items-center max-w-md text-center gap-6">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100 animate-pulse">
          <AlertOctagon className="h-8 w-8 stroke-[1.5]" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-display-md font-light tracking-tight leading-tight text-ink">
            Store Temporarily Suspended
          </h1>
          <p className="font-sans text-body-md text-shade-50">
            This ShopNest storefront has been temporarily suspended. Please contact the store owner or try again later.
          </p>
        </div>
        <Link
          href={mainUrl}
          className="inline-flex items-center justify-center font-sans font-medium rounded-full bg-primary text-on-primary hover:bg-shade-70 active:bg-shade-70 py-3 px-6 text-body-md min-h-11 transition-all duration-200 mt-2"
        >
          Return to ShopNest
        </Link>
      </div>
    </div>
  )
}
