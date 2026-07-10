import React from "react"
import { Receipt, FileText } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"

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
  const columns = React.useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        accessorKey: "paidAt",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground font-medium">
            {formatDate(row.original.paidAt)}
          </span>
        )
      },
      {
        accessorKey: "amountPaisa",
        header: "Amount",
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-foreground font-mono">
            {formatTaka(row.original.amountPaisa)}
          </span>
        )
      },
      {
        accessorKey: "paymentMethod",
        header: "Method",
        cell: ({ row }) => (
          <Badge variant="secondary" className="capitalize text-[10px] py-0.5 px-2">
            {row.original.paymentMethod}
          </Badge>
        )
      },
      {
        accessorKey: "transactionId",
        header: "Transaction ID",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground font-mono select-all">
            {row.original.transactionId}
          </span>
        )
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <>
              {status === "pending" && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border bg-amber-500/10 text-amber-800 border-amber-500/20 whitespace-nowrap shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span>Pending</span>
                </span>
              )}
              {status === "verified" && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border bg-emerald-500/10 text-emerald-800 border-emerald-500/20 whitespace-nowrap shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Verified</span>
                </span>
              )}
              {status === "rejected" && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border bg-rose-500/10 text-rose-800 border-rose-500/20 whitespace-nowrap shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Rejected</span>
                </span>
              )}
            </>
          )
        }
      },
      {
        id: "invoice",
        header: () => <div className="text-right">Invoice</div>,
        cell: ({ row }) => {
          const payment = row.original
          return (
            <div className="text-right">
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
            </div>
          )
        }
      }
    ],
    []
  )
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
    <DataTable
      columns={columns}
      data={payments}
      getRowId={(row) => row.id}
      hideSelectionCount={true}
    />
  )
}
