import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { redirect } from "next/navigation"
import { BulkFlashSalesClient } from "./components/BulkFlashSalesClient"

import { Suspense } from "react"

export default function BulkFlashSalesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading bulk flash sales editor...</div>}>
      <BulkFlashSalesPageContent />
    </Suspense>
  )
}

async function BulkFlashSalesPageContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    redirect("/login")
  }
  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <BulkFlashSalesClient merchantId={merchant.id} />
    </div>
  )
}
