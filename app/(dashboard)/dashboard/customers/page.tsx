import React from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import CustomersDirectory from "./customers-directory"

interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
  }>
}

export default function CustomersPage({ searchParams }: PageProps) {
  return <CustomersPageContent searchParams={searchParams} />
}

async function CustomersPageContent({ searchParams }: PageProps) {
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

  // 3. Resolve search details and pagination
  const resolvedParams = await searchParams
  const search = resolvedParams.search || ""
  const page = parseInt(resolvedParams.page || "1", 10)
  const limit = 50
  const offset = (page - 1) * limit

  // 4. Query customers for this merchant
  const { getCustomersByMerchant } = await import("@/db/queries/customers")
  const { customers, totalCount } = await getCustomersByMerchant(merchant.id, {
    search,
    limit,
    offset,
  })

  // Format dates to simple ISO strings for client compatibility
  const serializedCustomers = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    banned: c.banned,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <main className="w-full flex flex-col gap-6">
      <CustomersDirectory
        customers={serializedCustomers}
        totalCount={totalCount}
        search={search}
        limit={limit}
        offset={offset}
      />
    </main>
  )
}
