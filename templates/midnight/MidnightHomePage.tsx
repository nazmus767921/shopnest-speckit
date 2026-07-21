import React from "react"
import { type HomePageProps } from "../types"
import { SectionRenderer } from "@/components/storefront/sections/SectionRenderer"

export function MidnightHomePage({ store, sections }: HomePageProps) {
  return (
    <div>
      <SectionRenderer sections={sections} merchantId={store.id} subdomain={store.subdomain} />
    </div>
  )
}
