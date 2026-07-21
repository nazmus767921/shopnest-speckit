import React, { Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { auth } from "@/lib/auth/auth"
import AddressesForm from "./addresses"
import LogoutButton from "./logout-button"
import Link from "next/link"

interface PageProps {
  params: Promise<{ subdomain: string }>
}

export default function ProfilePage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-6 animate-pulse">Loading profile...</div>}>
      <ProfilePageContent params={params} />
    </Suspense>
  )
}

async function ProfilePageContent({ params }: PageProps) {
  await connection()
  const { subdomain } = await params
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")

  if (!merchantId) {
    redirect("/store-not-found")
  }

  const session = await auth.api.getSession({ headers: headersList })
  if (!session || !session.user || session.user.role !== "customer" || session.user.merchantId !== merchantId) {
    redirect(`/login`)
  }

  const { getCustomerDetails } = await import("@/db/queries/customers")
  const details = await getCustomerDetails(merchantId, session.user.id)

  if (!details) {
    redirect(`/login`)
  }

  const cleanedAddresses = (details.customerAddresses || []).map((addr) => ({
    id: addr.id,
    name: addr.name,
    phone: addr.phone,
    address: addr.address,
    city: addr.city,
    isDefault: addr.isDefault,
  }))

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-150">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">My Account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account settings, addresses and track your orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/orders`}>
            <span className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium px-4 py-2 h-9 cursor-pointer transition-colors">
              Order History
            </span>
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 flex flex-col gap-4 p-5 bg-white border border-gray-150 rounded-2xl shadow-sm h-fit">
          <h3 className="text-md font-semibold text-gray-900">Profile Information</h3>
          <div className="flex flex-col gap-3 text-sm">
            <div>
              <span className="text-gray-400 block text-xs">Name</span>
              <span className="font-medium text-gray-800">{details.name}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs">Email</span>
              <span className="font-medium text-gray-800">
                {details.email.includes("+") ? details.email.split("+")[0] + "@" + details.email.split("@")[1] : details.email}
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <AddressesForm
            subdomain={subdomain}
            userId={details.id}
            addresses={cleanedAddresses}
          />
        </div>
      </div>
    </main>
  )
}
