"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateCustomerStatus, banIpAddress } from "@/app/actions/customers"
import { Loader2Icon, ArrowLeftIcon, ShieldAlertIcon } from "@/lib/icons"
import Link from "next/link"

interface Address {
  id: string
  name: string
  phone: string
  address: string
  city: string
  isDefault: boolean
}

interface Customer {
  id: string
  name: string
  email: string
  banned: boolean | null
  banReason: string | null
  createdAt: string
  totalSpend: number
  ordersCount: number
  customerAddresses?: Address[]
}

interface CustomerDetailsViewProps {
  customer: Customer
  lastIp: string
}

export default function CustomerDetailsView({ customer, lastIp }: CustomerDetailsViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [banReason, setBanReason] = useState(customer.banReason || "")

  const handleToggleStatus = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await updateCustomerStatus({
        customerId: customer.id,
        banned: !customer.banned,
        banReason: !customer.banned ? banReason || "Suspended by admin" : undefined,
      })

      if (res.error) {
        setError(res.error)
      } else {
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  const handleBanIp = async () => {
    if (!confirm(`Are you sure you want to ban the IP address ${lastIp}?`)) return
    setError(null)
    setLoading(true)
    try {
      const res = await banIpAddress({
        ipAddress: lastIp,
        reason: `Banned client matching customer ${customer.name}`,
      })

      if (res.error) {
        setError(res.error)
      } else {
        alert(`Successfully banned IP address ${lastIp}`)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "Failed to ban IP address")
    } finally {
      setLoading(false)
    }
  }

  const cleanEmail = customer.email.includes("+") ? customer.email.split("+")[0] + "@" + customer.email.split("@")[1] : customer.email
  const joinedDate = new Date(customer.createdAt).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Format spend in Taka (converting paisa)
  const formattedSpend = `${(customer.totalSpend / 100).toFixed(2)} ৳`

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-6 bg-white border border-gray-150 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/customers" className="text-gray-500 hover:text-gray-900 flex items-center gap-1.5 text-sm">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to directory
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-150">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{customer.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Customer since {joinedDate}</p>
        </div>
        <div className="flex items-center gap-2">
          {customer.banned ? (
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 rounded-full border border-red-100">
              Suspended
            </span>
          ) : (
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 rounded-full border border-green-100">
              Active Account
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Stats & Moderation */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="flex flex-col gap-4 p-5 bg-gray-50 border border-gray-150 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-800">Stats Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Total Spend</span>
                <span className="text-lg font-bold text-gray-900">{formattedSpend}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Total Orders</span>
                <span className="text-lg font-bold text-gray-900">{customer.ordersCount}</span>
              </div>
            </div>
            <div className="flex flex-col border-t border-gray-200 pt-3 mt-1">
              <span className="text-xs text-gray-400">Email Address</span>
              <span className="text-sm font-medium text-gray-800">{cleanEmail}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Last Seen IP</span>
              <span className="text-sm font-mono text-gray-800">{lastIp}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5 border border-red-100 bg-red-50/30 rounded-xl">
            <h3 className="text-sm font-semibold text-red-800 flex items-center gap-1.5">
              <ShieldAlertIcon className="h-4 w-4" />
              Moderation Controls
            </h3>

            <div className="flex flex-col gap-2">
              <label htmlFor="reason" className="text-xs font-medium text-gray-600">Suspension Reason</label>
              <Input
                id="reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for suspension..."
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <Button
                variant={customer.banned ? "outline" : "destructive"}
                onClick={handleToggleStatus}
                disabled={loading}
                className="w-full text-xs"
              >
                {loading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin mr-1.5" />
                ) : null}
                {customer.banned ? "Reactivate Account" : "Suspend Account"}
              </Button>

              <Button
                variant="outline"
                onClick={handleBanIp}
                disabled={loading}
                className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                Ban IP Address
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Addresses List */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <h3 className="text-md font-semibold text-gray-900">Saved Addresses</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!customer.customerAddresses || customer.customerAddresses.length === 0 ? (
              <div className="col-span-full py-8 text-center border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                No addresses saved for this customer.
              </div>
            ) : (
              customer.customerAddresses.map((addr) => (
                <div key={addr.id} className="p-4 bg-white border border-gray-150 rounded-xl relative shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{addr.name}</span>
                    {addr.isDefault && (
                      <span className="px-1.5 py-0.5 text-[9px] font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 block">{addr.phone}</span>
                  <p className="text-xs text-gray-700 mt-2">{addr.address}, {addr.city}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
