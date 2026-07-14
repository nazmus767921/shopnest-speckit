import React, { Suspense } from "react"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { connection } from "next/server"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import CustomerDetailsView from "./customer-details"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CustomerDetailsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500 animate-pulse">Loading customer details...</div>}>
      <CustomerDetailsPageContent params={params} />
    </Suspense>
  )
}

async function CustomerDetailsPageContent({ params }: PageProps) {
  await connection()
  const headersList = await headers()

  // 1. Resolve auth session
  const session = await auth.api.getSession({ headers: headersList })
  if (!session || !session.user) {
    redirect("/login")
  }

  // 2. Fetch merchant associated with owner ID
  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    redirect("/onboarding")
  }

  // 3. Resolve customer ID
  const { id } = await params

  // 4. Query customer details for this merchant
  const { getCustomerDetails } = await import("@/db/queries/customers")
  const details = await getCustomerDetails(merchant.id, id)

  if (!details) {
    notFound()
  }

  // Format dates to simple ISO strings for client compatibility
  const serializedCustomer = {
    id: details.id,
    name: details.name,
    email: details.email,
    banned: details.banned,
    banReason: details.banReason,
    createdAt: details.createdAt.toISOString(),
    totalSpend: details.totalSpend,
    ordersCount: details.ordersCount,
    customerAddresses: (details.customerAddresses || []).map((addr) => ({
      id: addr.id,
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      isDefault: addr.isDefault,
    })),
  }

  // In a real database we would log checkout client IP; here we simulate/estimate it
  const simulatedLastIp = "103.20.14.8"

  return (
    <main className="w-full">
      <CustomerDetailsView customer={serializedCustomer} lastIp={simulatedLastIp} />
    </main>
  )
}
