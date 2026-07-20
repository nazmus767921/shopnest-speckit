import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { redirect } from "next/navigation"
import { BulkFlashSalesClient } from "./components/BulkFlashSalesClient"

export default async function BulkFlashSalesPage() {
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
