"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { 
  updateCustomerStatus, 
  banIpAddress, 
  addCustomerNoteAction, 
  deleteCustomerAction, 
  exportCustomerDataCsvAction
} from "@/app/actions/customers"
import { authClient } from "@/lib/auth/auth-client"
import { 
  Loader2Icon, 
  ArrowLeftIcon, 
  ShieldAlertIcon, 
  KeyIcon, 
  DownloadIcon, 
  CopyIcon, 
  CheckIcon,
  ExternalLinkIcon
} from "@/lib/icons"
import Link from "next/link"

interface Address {
  id: string
  name: string
  phone: string
  address: string
  city: string
  isDefault: boolean
}

interface CustomerNote {
  id: string
  content: string
  createdAt: string
  authorName: string
}

interface CustomerOrder {
  id: string
  status: string
  totalPaisa: number
  createdAt: string
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
  notes?: CustomerNote[]
  orders?: CustomerOrder[]
}

interface CustomerDetailsViewProps {
  customer: Customer
  lastIp: string
}

export default function CustomerDetailsView({ customer, lastIp }: CustomerDetailsViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [banReason, setBanReason] = useState(customer.banReason || "")
  const [newNote, setNewNote] = useState("")

  // Copy States
  const [copiedIp, setCopiedIp] = useState(false)
  const [copiedAddressId, setCopiedAddressId] = useState<string | null>(null)

  // Dialog States
  const [isSuspendOpen, setIsSuspendOpen] = useState(false)
  const [isBanIpOpen, setIsBanIpOpen] = useState(false)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  // Clipboard Copiers
  const handleCopyIp = () => {
    navigator.clipboard.writeText(lastIp)
    setCopiedIp(true)
    toast.success("IP address copied to clipboard")
    setTimeout(() => setCopiedIp(false), 1500)
  }

  const handleCopyAddress = (id: string, addressText: string) => {
    navigator.clipboard.writeText(addressText)
    setCopiedAddressId(id)
    toast.success("Address copied to clipboard")
    setTimeout(() => setCopiedAddressId(null), 1500)
  }

  // Business Action Handlers
  const handleToggleStatus = async () => {
    setLoading(true)
    try {
      const res = await updateCustomerStatus({
        customerId: customer.id,
        banned: !customer.banned,
        banReason: !customer.banned ? banReason || "Suspended by admin" : undefined,
      })
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(
          customer.banned 
            ? "Account reactivated successfully" 
            : "Account suspended successfully"
        )
        setIsSuspendOpen(false)
        router.refresh()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleBanIp = async () => {
    setLoading(true)
    try {
      const res = await banIpAddress({
        ipAddress: lastIp,
        reason: `Banned client matching customer ${customer.name}`,
      })
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Successfully banned IP address ${lastIp}`)
        setIsBanIpOpen(false)
        router.refresh()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to ban IP address"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setLoading(true)
    try {
      const res = await addCustomerNoteAction(customer.id, newNote.trim())
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Internal note added successfully")
        setNewNote("")
        router.refresh()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add note"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm account deletion.")
      return
    }

    setLoading(true)
    try {
      const res = await deleteCustomerAction(customer.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Account deleted permanently.")
        setIsDeleteOpen(false)
        router.push("/dashboard/customers")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete account"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setLoading(true)
    try {
      // @ts-expect-error - forgetPassword exists but TS merges it with emailOtp plugin types incorrectly
      const res = await authClient.forgetPassword({ email: customer.email, redirectTo: "/login" })
      if (res.error) {
        toast.error(res.error.message || "Failed to initiate password reset.")
      } else {
        toast.success("Password reset email sent successfully.")
        setIsResetPasswordOpen(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send password reset"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    setLoading(true)
    try {
      const res = await exportCustomerDataCsvAction(customer.id)
      if (res.error) {
        toast.error(res.error)
      } else if (res.csv) {
        const blob = new Blob([res.csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `customer-${customer.id}-export.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Customer order data exported successfully.")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to export data"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const cleanEmail = customer.email.includes("+") 
    ? customer.email.split("+")[0] + "@" + customer.email.split("@")[1] 
    : customer.email

  const joinedDate = new Date(customer.createdAt).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedSpend = `${(customer.totalSpend / 100).toFixed(2)} ৳`
  const aov = customer.ordersCount > 0 
    ? `${((customer.totalSpend / customer.ordersCount) / 105).toFixed(2)} ৳` 
    : "0.00 ৳"

  // Order status badge helper
  const getStatusBadge = (status: string) => {
    const cleanStatus = status.toLowerCase().replace(/_/g, " ")
    switch (cleanStatus) {
      case "completed":
      case "paid":
      case "delivered":
        return <Badge variant="mint" className="capitalize">{cleanStatus}</Badge>
      case "pending":
      case "awaiting payment":
        return <Badge variant="secondary" className="capitalize bg-amber-50 text-amber-700 border-amber-250">{cleanStatus}</Badge>
      case "processing":
      case "shipped":
        return <Badge variant="secondary" className="capitalize bg-indigo-50 text-indigo-700 border-indigo-250">{cleanStatus}</Badge>
      case "cancelled":
      case "failed":
      case "refunded":
        return <Badge variant="destructive" className="capitalize">{cleanStatus}</Badge>
      default:
        return <Badge variant="outline" className="capitalize">{cleanStatus}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-slate-50/10 min-h-screen text-slate-900">
      
      {/* Back Button Navigation */}
      <div>
        <Link 
          href="/dashboard/customers" 
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors font-semibold"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to directory
        </Link>
      </div>

      {/* ─── BENTO GRID CONTAINER ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ROW 1 ──────────────────────────────────────────────────────────── */}
        
        {/* Profile Tile (2/3 width) */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold bg-slate-100 text-slate-700 border-2 select-none ${
              customer.banned 
                ? "border-red-200" 
                : "border-slate-200"
            }`}>
              {customer.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{customer.name}</h1>
                {customer.banned ? (
                  <Badge variant="destructive">Suspended</Badge>
                ) : (
                  <Badge variant="mint">Active Customer</Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1">{cleanEmail}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsResetPasswordOpen(true)} 
              disabled={loading}
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl h-9 cursor-pointer"
            >
              <KeyIcon className="h-4 w-4 mr-2 text-slate-500" />
              Reset Password
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportData} 
              disabled={loading}
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl h-9 cursor-pointer"
            >
              {loading ? (
                <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <DownloadIcon className="h-4 w-4 mr-2 text-slate-500" />
              )}
              Export CSV
            </Button>
            <Button 
              variant={customer.banned ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setIsSuspendOpen(true)} 
              disabled={loading}
              className={`font-semibold rounded-xl h-9 cursor-pointer ${
                customer.banned 
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-900" 
                  : "border-slate-200 hover:bg-red-50/50 text-red-650 hover:text-red-750"
              }`}
            >
              <ShieldAlertIcon className="h-4 w-4 mr-2" />
              {customer.banned ? "Reactivate" : "Suspend"}
            </Button>
          </div>
        </div>

        {/* Spend Metric Tile (1/3 width) */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Spend</span>
            <span className="text-3xl font-black text-slate-900 mt-2 block">{formattedSpend}</span>
          </div>
          <span className="text-xs text-slate-500 font-medium mt-4">Lifetime transaction value accumulated</span>
        </div>

        {/* ROW 2 ──────────────────────────────────────────────────────────── */}
        
        {/* Total Orders Tile (1/3 width) */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-[180px]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
            <span className="text-3xl font-black text-slate-900 mt-2 block">{customer.ordersCount}</span>
          </div>
          <span className="text-xs text-slate-500 font-medium mt-4">Average Order Value: {aov}</span>
        </div>

        {/* Saved Addresses Tile (1/3 width) */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-[180px]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Primary Shipping Location</span>
            {(!customer.customerAddresses || customer.customerAddresses.length === 0) ? (
              <span className="text-xs text-slate-400 font-medium block mt-1">No addresses saved.</span>
            ) : (
              (() => {
                const defaultAddr = customer.customerAddresses.find(a => a.isDefault) || customer.customerAddresses[0]
                return (
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-900">{defaultAddr.name}</span>
                      {defaultAddr.isDefault && <Badge variant="mint" className="text-[9px] px-1 py-0 h-4 font-bold">Default</Badge>}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">{`${defaultAddr.address}, ${defaultAddr.city}`}</p>
                  </div>
                )
              })()
            )}
          </div>
          
          {customer.customerAddresses && customer.customerAddresses.length > 0 && (
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold">{customer.customerAddresses.length} Address{customer.customerAddresses.length > 1 ? "es" : ""} Saved</span>
              
              {(() => {
                const defaultAddr = customer.customerAddresses.find(a => a.isDefault) || customer.customerAddresses[0]
                const fullAddressText = `${defaultAddr.name}, ${defaultAddr.phone}, ${defaultAddr.address}, ${defaultAddr.city}`
                return (
                  <button 
                    onClick={() => handleCopyAddress(defaultAddr.id, fullAddressText)}
                    className="text-[10px] font-bold text-indigo-650 hover:text-indigo-900 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedAddressId === defaultAddr.id ? (
                      <>
                        <CheckIcon className="h-3 w-3 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-3 w-3" />
                        Copy Default
                      </>
                    )}
                  </button>
                )
              })()}
            </div>
          )}
        </div>

        {/* Telemetry & Audit Tile (1/3 width) */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-[180px]">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Device & Telemetry Audit</span>
            <div className="flex flex-col gap-1.5 mt-1 text-xs font-semibold text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Last Known IP</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono">{lastIp}</span>
                  <button 
                    onClick={handleCopyIp} 
                    className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100 cursor-pointer"
                    title="Copy IP"
                  >
                    {copiedIp ? <CheckIcon className="h-3 w-3 text-emerald-500" /> : <CopyIcon className="h-3 w-3" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Est. Location</span>
                <span>Dhaka, BD</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono font-medium border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>Client: Chrome / Win11</span>
            <span>Joined: {joinedDate}</span>
          </div>
        </div>

        {/* ROW 3 ──────────────────────────────────────────────────────────── */}
        
        {/* Recent Orders List Table (2/3 width) - Fixed Height Scroll */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Recent Orders</h3>
                <p className="text-xs text-slate-400 mt-0.5">Purchases made by this account</p>
              </div>
              <span className="text-xs text-slate-500 font-bold">{customer.orders ? customer.orders.length : 0} Order{customer.orders && customer.orders.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="h-[260px] overflow-y-auto pr-1">
              {(!customer.orders || customer.orders.length === 0) ? (
                <div className="py-12 text-center text-sm text-slate-400 font-medium">No orders recorded for this customer.</div>
              ) : (
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-[10px] text-slate-400 bg-slate-50 uppercase tracking-wider sticky top-0 bg-white">
                    <tr>
                      <th scope="col" className="pb-3 font-bold">Order ID</th>
                      <th scope="col" className="pb-3 font-bold">Date</th>
                      <th scope="col" className="pb-3 font-bold">Status</th>
                      <th scope="col" className="pb-3 font-bold text-right">Total</th>
                      <th scope="col" className="pb-3 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3">
                          <Link 
                            href={`/dashboard/orders/${o.id}`}
                            className="font-mono font-bold text-indigo-600 hover:text-indigo-900 hover:underline"
                          >
                            #{o.id.slice(0, 8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="py-3 text-slate-500 font-semibold">
                          {new Date(o.createdAt).toLocaleDateString("en-BD", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3">{getStatusBadge(o.status)}</td>
                        <td className="py-3 text-right font-bold text-slate-800">{(o.totalPaisa / 100).toFixed(2)} ৳</td>
                        <td className="py-3 text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link 
                                  href={`/dashboard/orders/${o.id}`}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:text-indigo-650 hover:bg-indigo-50 border border-slate-150 transition-colors"
                                >
                                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Status Moderation Tile (1/3 width) */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">Account Moderation</h3>
            
            <div className="flex flex-col gap-3">
              <label htmlFor="reason-field" className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                Suspension Reason
              </label>
              <Input
                id="reason-field"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. Terms violations..."
                disabled={loading}
                className="rounded-xl bg-slate-50/50 border-slate-200 focus-visible:bg-white text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <Button
              variant={customer.banned ? "outline" : "secondary"}
              onClick={() => setIsSuspendOpen(true)}
              disabled={loading}
              className={`w-full font-semibold rounded-xl h-10 cursor-pointer ${
                customer.banned 
                  ? "border-slate-200 text-slate-700 hover:bg-slate-50" 
                  : "bg-red-50 text-red-650 hover:bg-red-100 border border-red-100 hover:text-red-750"
              }`}
            >
              {customer.banned ? "Reactivate Account" : "Suspend Account"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsBanIpOpen(true)}
              disabled={loading}
              className="w-full border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl h-10 cursor-pointer"
            >
              Ban IP Address ({lastIp})
            </Button>
          </div>
        </div>

        {/* ROW 4 ──────────────────────────────────────────────────────────── */}
        
        {/* Internal Notes Tile (2/3 width) - note Adding Form + note Timeline scroll */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">Internal Admin Notes</h3>
            
            {/* Note creation input */}
            <div className="flex flex-col gap-3 mb-5 p-4 border border-slate-150 rounded-xl bg-slate-50/30">
              <Textarea 
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Record overrides, customer correspondence notes, etc..."
                className="bg-white min-h-[80px] text-sm rounded-xl border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-350"
                disabled={loading}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddNote} 
                  disabled={loading || !newNote.trim()}
                  className="font-semibold rounded-xl h-8 px-4 text-xs cursor-pointer"
                >
                  {loading && <Loader2Icon className="h-3 w-3 animate-spin mr-1.5" />}
                  Save Note
                </Button>
              </div>
            </div>

            {/* Note Timeline History */}
            <div className="h-[220px] overflow-y-auto pr-2">
              {(!customer.notes || customer.notes.length === 0) ? (
                <div className="py-8 text-center border border-dashed border-slate-150 rounded-xl text-slate-400 text-xs font-semibold bg-slate-50/10">No internal notes added.</div>
              ) : (
                <div className="relative pl-5 border-l border-slate-100 flex flex-col gap-5 ml-2">
                  {customer.notes.map((note) => {
                    const initials = note.authorName.substring(0, 2).toUpperCase()
                    return (
                      <div key={note.id} className="relative">
                        
                        {/* Dot indicator */}
                        <div className="absolute -left-[26px] top-1.5 h-3.5 w-3.5 rounded-full bg-white border border-indigo-400 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        </div>

                        {/* Speech card */}
                        <div className="bg-slate-50/30 border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
                          <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                            <span className="font-semibold text-slate-505">By {note.authorName} ({initials})</span>
                            <span className="font-mono">{new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Danger Zone Tile (1/3 width, Red Background Fill) */}
        <div className="md:col-span-1 bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-start gap-2.5 border-b border-red-150 pb-3 mb-4">
              <ShieldAlertIcon className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-extrabold text-red-950 uppercase tracking-wider">Danger Zone</h3>
                <p className="text-[10px] text-red-500 mt-0.5 font-semibold">Destructive administrative overrides.</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Deleting this account removes all addresses, customer notes, and account associations permanently. 
              This operation cannot be undone.
            </p>
          </div>

          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteOpen(true)}
            disabled={loading}
            className="w-full mt-6 font-semibold rounded-xl h-10 cursor-pointer"
          >
            Delete Account
          </Button>
        </div>

      </div>

      {/* ─── CONFIRMATION DIALOGS (SHADCN ALERTLERTDIALOG) ────────────────────── */}

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {customer.banned ? "Reactivate Customer Account?" : "Suspend Customer Account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {customer.banned 
                ? `This will restore storefront login and checkout access for ${customer.name}.`
                : `Are you sure you want to suspend ${customer.name}? They will be immediately logged out of all devices and blocked from making purchases.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {!customer.banned && (
            <div className="py-2 flex flex-col gap-1.5">
              <label htmlFor="modal-reason" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Specify Reason for Suspension
              </label>
              <Input
                id="modal-reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for suspension..."
                className="rounded-xl text-sm"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleToggleStatus} 
              disabled={loading}
              variant={customer.banned ? "default" : "destructive"}
            >
              {loading && <Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
              {customer.banned ? "Reactivate Account" : "Suspend Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban IP Confirmation Dialog */}
      <AlertDialog open={isBanIpOpen} onOpenChange={setIsBanIpOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban Client IP Address?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to blacklist IP Address <span className="font-mono font-bold text-slate-900">{lastIp}</span>? 
              This will block all HTTP requests originating from this address across all subdomains.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBanIp} 
              disabled={loading}
              variant="destructive"
            >
              {loading && <Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
              Ban IP Address
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Confirmation Dialog */}
      <AlertDialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Initiate Password Reset?</AlertDialogTitle>
            <AlertDialogDescription>
              Send an email containing a secure password reset link to <span className="font-semibold text-slate-900">{customer.email}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePasswordReset} 
              disabled={loading}
            >
              {loading && <Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
              Send Reset Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={(open) => {
        setIsDeleteOpen(open)
        if (!open) setDeleteConfirmText("")
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-655 flex items-center gap-2">
              <ShieldAlertIcon className="h-5 w-5 text-red-600" />
              Permanently Delete Customer Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This is a highly destructive operation. It will permanently delete {customer.name}&apos;s profile data, address books, and internal notes. 
              Past order records will be kept for accounting purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2 flex flex-col gap-2">
            <label htmlFor="confirm-delete-field" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Type <span className="font-black text-red-600">DELETE</span> to confirm
            </label>
            <Input
              id="confirm-delete-field"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE..."
              className="rounded-xl border-red-200 focus-visible:ring-red-100 text-sm font-semibold"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading} onClick={() => setDeleteConfirmText("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount} 
              disabled={loading || deleteConfirmText !== "DELETE"}
              variant="destructive"
            >
              {loading && <Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
