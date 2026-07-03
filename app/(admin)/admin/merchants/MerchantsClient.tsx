"use client"

import React, { useState } from "react"
import {
  updateMerchantStatusAction,
  overrideTrialExpiryAction,
} from "@/app/actions/admin"
import { ShieldAlert, Calendar, Search, Edit2, Loader2, ArrowUpRight, Ban, CheckCircle } from "lucide-react"

interface Merchant {
  id: string
  name: string
  subdomain: string
  plan: string
  subscriptionStatus: string
  trialExpiry: string | null
  owner: {
    id: string
    name: string
    email: string
  } | null
  subscription: {
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
  } | null
}

interface Props {
  initialMerchants: Merchant[]
}

export function MerchantsClient({ initialMerchants }: Props) {
  const [merchants, setMerchants] = useState<Merchant[]>(initialMerchants)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPlan, setFilterPlan] = useState<string>("all")
  
  // Extract unique plans from initial data for dynamic tabs
  const availablePlans = Array.from(new Set(initialMerchants.map((m) => m.plan))).sort()
  
  // Modals state
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showExpiryModal, setShowExpiryModal] = useState(false)
  
  // Forms state
  const [newStatus, setNewStatus] = useState<"trial" | "active" | "suspended" | "cancelled">("active")
  const [newExpiryDate, setNewExpiryDate] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredMerchants = merchants.filter((m) => {
    // 1. Search term
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      m.name.toLowerCase().includes(term) ||
      m.subdomain.toLowerCase().includes(term) ||
      (m.owner?.name || "").toLowerCase().includes(term) ||
      (m.owner?.email || "").toLowerCase().includes(term)

    // 2. Status filter
    const matchesStatus = filterStatus === "all" || m.subscriptionStatus === filterStatus

    // 3. Plan filter
    const matchesPlan = filterPlan === "all" || m.plan === filterPlan

    return matchesSearch && matchesStatus && matchesPlan
  })

  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMerchant) return
    setLoading(true)
    setError(null)

    const res = await updateMerchantStatusAction({
      merchantId: selectedMerchant.id,
      status: newStatus,
    })

    if (res.success) {
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === selectedMerchant.id ? { ...m, subscriptionStatus: newStatus } : m
        )
      )
      setShowStatusModal(false)
      setSelectedMerchant(null)
    } else {
      setError(res.error || "Failed to update store status.")
    }
    setLoading(false)
  }

  const handleExpiryOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMerchant || !newExpiryDate) return
    setLoading(true)
    setError(null)

    const dateISO = new Date(newExpiryDate).toISOString()

    const res = await overrideTrialExpiryAction({
      merchantId: selectedMerchant.id,
      trialExpiry: dateISO,
    })

    if (res.success) {
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === selectedMerchant.id ? { ...m, trialExpiry: dateISO } : m
        )
      )
      setShowExpiryModal(false)
      setSelectedMerchant(null)
    } else {
      setError(res.error || "Failed to override trial expiry.")
    }
    setLoading(false)
  }

  const openStatusModal = (m: Merchant, status: "trial" | "active" | "suspended" | "cancelled") => {
    setSelectedMerchant(m)
    setNewStatus(status)
    setShowStatusModal(true)
  }

  const openExpiryModal = (m: Merchant) => {
    setSelectedMerchant(m)
    if (m.trialExpiry) {
      // Format to YYYY-MM-DD for date input
      const d = new Date(m.trialExpiry)
      const formatted = d.toISOString().split("T")[0]
      setNewExpiryDate(formatted)
    } else {
      setNewExpiryDate("")
    }
    setShowExpiryModal(true)
  }

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      trial: "bg-amber-50 text-amber-800 border-amber-100",
      active: "bg-emerald-50 text-emerald-800 border-emerald-100",
      suspended: "bg-red-50 text-red-800 border-red-100",
      cancelled: "bg-zinc-100 text-zinc-600 border-zinc-200",
    }
    return classes[status as keyof typeof classes] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"
  }

  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return "—"
    return new Date(isoString).toLocaleDateString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search Filter */}
      <div className="relative max-w-md w-full">
        <span className="absolute inset-y-0 left-3.5 flex items-center text-shade-40">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Search merchants, subdomains, owners..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-caption border border-hairline-light rounded-full pl-10 pr-4 py-2.5 min-h-10 bg-canvas-light text-ink placeholder-shade-40 outline-none focus:border-shade-60 transition-all font-sans"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Status Tabs */}
        <div className="flex flex-wrap bg-zinc-100 p-1 rounded-lg gap-1 border border-hairline-light">
          {["all", "active", "trial", "suspended", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                filterStatus === status
                  ? "bg-white text-ink shadow-sm border border-hairline-light/50"
                  : "text-shade-50 hover:text-ink hover:bg-zinc-200/50"
              }`}
            >
              {status === "all" ? "All Status" : status}
            </button>
          ))}
        </div>

        {/* Plan Tabs */}
        <div className="flex flex-wrap bg-zinc-100 p-1 rounded-lg gap-1 border border-hairline-light">
          {["all", ...availablePlans].map((plan) => (
            <button
              key={plan}
              onClick={() => setFilterPlan(plan)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                filterPlan === plan
                  ? "bg-white text-ink shadow-sm border border-hairline-light/50"
                  : "text-shade-50 hover:text-ink hover:bg-zinc-200/50"
              }`}
            >
              {plan === "all" ? "All Plans" : plan}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-canvas-light border border-hairline-light rounded-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-hairline-light bg-zinc-50/50 text-[10px] font-bold text-shade-60 uppercase tracking-wider">
              <th className="px-6 py-4">Boutique Store</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Plan / Limits</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Period / Trial End</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-light text-caption text-ink">
            {filteredMerchants.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-shade-40 font-light">
                  No merchants found matching your query.
                </td>
              </tr>
            ) : (
              filteredMerchants.map((merchant) => {
                const isSuspended = merchant.subscriptionStatus === "suspended"
                const activePeriodEnd = merchant.subscription?.currentPeriodEnd
                
                return (
                  <tr key={merchant.id} className="hover:bg-canvas-cream/10 transition">
                    <td className="px-6 py-4 flex flex-col">
                      <span className="font-semibold text-ink">{merchant.name}</span>
                      <a
                        href={`http://${merchant.subdomain}.localhost:3000`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-caption text-emerald-800 hover:underline inline-flex items-center gap-0.5 font-mono"
                      >
                        {merchant.subdomain}.shopnest.com.bd
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      {merchant.owner ? (
                        <div className="flex flex-col">
                          <span className="text-ink font-medium">{merchant.owner.name}</span>
                          <span className="text-caption text-shade-40">{merchant.owner.email}</span>
                        </div>
                      ) : (
                        <span className="text-shade-40 italic">No Owner</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="capitalize font-medium text-ink">{merchant.plan}</span>
                        <span className="text-micro text-shade-40">
                          {merchant.plan === "starter" ? "50 prod / 200 orders" : "Unlimited"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-micro font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(merchant.subscriptionStatus)}`}>
                        {merchant.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-caption text-shade-70">
                      {merchant.subscriptionStatus === "active" ? (
                        <span className="text-emerald-800">
                          Renew: {formatDate(activePeriodEnd)}
                        </span>
                      ) : (
                        <span>
                          Trial: {formatDate(merchant.trialExpiry)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {merchant.subscriptionStatus !== "active" && (
                          <button
                            onClick={() => openExpiryModal(merchant)}
                            className="p-1.5 hover:bg-canvas-cream border border-hairline-light rounded text-shade-50 hover:text-ink transition"
                            title="Override Trial Expiry"
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                        )}
                        {isSuspended ? (
                          <button
                            onClick={() => openStatusModal(merchant, "active")}
                            className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100 rounded text-caption font-semibold transition"
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => openStatusModal(merchant, "suspended")}
                            className="px-3 py-1 bg-red-50 text-red-800 border border-red-100 hover:bg-red-100 rounded text-caption font-semibold transition"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Action Modals */}
      {showStatusModal && selectedMerchant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fade-in">
          <form
            onSubmit={handleStatusChangeSubmit}
            className="w-full max-w-md bg-canvas-light border border-hairline-light rounded-xl p-6 flex flex-col gap-5"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${newStatus === "suspended" ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                {newStatus === "suspended" ? <Ban className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
              </div>
              <h2 className="text-heading-md font-display font-semibold text-ink">
                Confirm Status Override
              </h2>
            </div>

            <p className="text-body-md text-shade-50 font-light">
              Are you sure you want to change <strong>{selectedMerchant.name}</strong>'s subscription status to{" "}
              <strong className="text-ink">{newStatus}</strong>?
              {newStatus === "suspended" && (
                <span className="block mt-2 text-caption text-red-700 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                  Boutique customers will be greeted with a 402 Suspended Page and will not be able to browse or place orders.
                </span>
              )}
            </p>

            {error && <div className="text-caption text-red-700">{error}</div>}

            <div className="flex gap-3 justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-hairline-light rounded-full text-caption font-semibold text-shade-60 hover:bg-canvas-cream transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2 rounded-full text-caption font-semibold text-white flex items-center gap-2 transition ${newStatus === "suspended" ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-zinc-800"}`}
              >
                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                Confirm Status
              </button>
            </div>
          </form>
        </div>
      )}

      {showExpiryModal && selectedMerchant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fade-in">
          <form
            onSubmit={handleExpiryOverrideSubmit}
            className="w-full max-w-md bg-canvas-light border border-hairline-light rounded-xl p-6 flex flex-col gap-5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg">
                <Calendar className="h-5 w-5" />
              </div>
              <h2 className="text-heading-md font-display font-semibold text-ink">
                Override Trial Expiry
              </h2>
            </div>

            <p className="text-body-md text-shade-50 font-light">
              Adjust the free trial duration for boutique store <strong>{selectedMerchant.name}</strong>.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-eyebrow-cap font-semibold text-shade-50 uppercase">
                New Expiry Date
              </label>
              <input
                type="date"
                required
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="w-full text-body-md border border-hairline-light rounded-md px-3.5 py-2.5 bg-canvas-light text-ink focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            {error && <div className="text-caption text-red-700">{error}</div>}

            <div className="flex gap-3 justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowExpiryModal(false)}
                className="px-4 py-2 border border-hairline-light rounded-full text-caption font-semibold text-shade-60 hover:bg-canvas-cream transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !newExpiryDate}
                className="px-5 py-2 bg-black text-white hover:bg-zinc-800 rounded-full text-caption font-semibold flex items-center gap-2 transition"
              >
                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                Update Expiry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
