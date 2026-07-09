import React from "react"
import { Receipt, FileText } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface Payment {
  id: string
  amountPaisa: number
  paymentMethod: string
  transactionId: string
  status: string
  months: number
  paidAt: Date
}

interface PaymentHistoryTableProps {
  payments: Payment[]
}

function formatTaka(paisa: number): string {
  return `৳ ${(paisa / 100).toFixed(2)}`
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function PaymentHistoryTable({ payments }: PaymentHistoryTableProps) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 border border-border rounded-xl bg-card text-foreground">
        <div className="p-3.5 bg-muted rounded-full mb-3.5">
          <Receipt className="h-7 w-7 text-foreground stroke-1.5" />
        </div>
        <p className="text-base font-bold text-foreground">No payments recorded yet</p>
        <p className="text-sm text-muted-foreground max-w-sm mt-1 leading-normal font-light">
          Your payment history will appear here once you submit your first manual renewal or upgrade request.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden text-foreground">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Method</th>
              <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction ID</th>
              <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-muted/10 transition-colors">
                <td className="px-5 py-4 text-sm text-muted-foreground font-medium">
                  {formatDate(payment.paidAt)}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-foreground font-mono">
                  {formatTaka(payment.amountPaisa)}
                </td>
                <td className="px-5 py-4">
                  <Badge variant="secondary" className="capitalize text-[10px] py-0.5 px-2">
                    {payment.paymentMethod}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground font-mono select-all">
                  {payment.transactionId}
                </td>
                <td className="px-5 py-4">
                  {payment.status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border bg-amber-500/10 text-amber-800 border-amber-500/20 whitespace-nowrap shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-50 animate-pulse shrink-0" />
                      <span>Pending</span>
                    </span>
                  )}
                  {payment.status === "verified" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border bg-emerald-500/10 text-emerald-800 border-emerald-500/20 whitespace-nowrap shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Verified</span>
                    </span>
                  )}
                  {payment.status === "rejected" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border bg-rose-500/10 text-rose-800 border-rose-500/20 whitespace-nowrap shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Rejected</span>
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  {payment.status === "verified" ? (
                    <Link
                      href={`/dashboard/billing/invoices/${payment.id}`}
                      className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                      title="View Invoice"
                    >
                      <FileText className="h-4.5 w-4.5" />
                    </Link>
                  ) : (
                    <span className="text-muted-foreground/30 select-none">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
