import React from "react"
import { HomePageProps } from "../types"
import { SectionRenderer } from "@/components/storefront/sections/SectionRenderer"

export function SunsetHomePage({ store, sections }: HomePageProps) {
  return (
    <div>
      <SectionRenderer sections={sections} merchantId={store.id} subdomain={store.subdomain} />
    </div>
  )
}
