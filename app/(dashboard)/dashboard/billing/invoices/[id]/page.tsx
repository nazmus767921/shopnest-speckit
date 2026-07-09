import React from "react"
import { notFound } from "next/navigation"
import { db } from "@/db"
import { subscriptionPayments, merchants, subscriptions } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { InvoiceActions } from "./InvoiceActions"
import { Suspense } from "react"

export const metadata = {
  title: "Invoice — ShopNest",
}

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense fallback={<InvoiceSkeleton />}>
      <InvoicePageContent params={params} />
    </Suspense>
  )
}

async function InvoicePageContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return notFound()

  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) return notFound()

  const payment = await db.query.subscriptionPayments.findFirst({
    where: and(
      eq(subscriptionPayments.id, id),
      eq(subscriptionPayments.merchantId, merchant.id),
      eq(subscriptionPayments.status, "verified")
    ),
  })

  if (!payment) return notFound()

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.merchantId, merchant.id),
  })

  const invoiceNumber = `INV-${payment.id.split("-")[0].toUpperCase()}`
  const dateStr = new Date(payment.paidAt).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  
  const amountTaka = (payment.amountPaisa / 100).toFixed(2)

  return (
    <div className="max-w-3xl mx-auto p-8 bg-card border border-border text-foreground rounded-xl print:p-0 print:border-none print:bg-transparent">
      <div className="flex items-center justify-between mb-12">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-foreground">INVOICE</h1>
          <p className="text-sm text-muted-foreground">#{invoiceNumber}</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-primary">ShopNest</h2>
          <p className="text-sm text-muted-foreground">Dhaka, Bangladesh</p>
          <p className="text-sm text-muted-foreground">billing@shopnest.com.bd</p>
        </div>
      </div>

      <div className="flex justify-between items-start border-b border-border pb-8 mb-8">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Billed To</p>
          <p className="text-sm font-semibold text-foreground">{merchant.name}</p>
          <p className="text-sm text-muted-foreground">{merchant.subdomain}.shopnest.com.bd</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Payment Date</p>
          <p className="text-sm font-medium text-foreground">{dateStr}</p>
          
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-4">Payment Method</p>
          <p className="text-sm font-medium text-foreground capitalize">{payment.paymentMethod} (TxID: {payment.transactionId})</p>
        </div>
      </div>

      <table className="w-full mb-12 text-left border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</th>
            <th className="py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Months</th>
            <th className="py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="py-4 text-sm text-foreground">ShopNest {subscription?.plan || merchant.plan} Plan Subscription</td>
            <td className="py-4 text-sm text-foreground text-center">{payment.months}</td>
            <td className="py-4 text-sm font-mono text-foreground text-right">৳ {amountTaka}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="py-4 text-right text-base font-semibold text-foreground">Total Paid</td>
            <td className="py-4 text-right text-lg font-mono font-bold text-foreground">৳ {amountTaka}</td>
          </tr>
        </tfoot>
      </table>

      <div className="text-center pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground">Thank you for building your business with ShopNest.</p>
        <p className="text-xs text-muted-foreground mt-1">This is a computer-generated invoice and requires no signature.</p>
      </div>

      <InvoiceActions />
    </div>
  )
}

function InvoiceSkeleton() {
  return (
    <div className="max-w-3xl mx-auto p-8 bg-card border border-border rounded-xl h-96 w-full animate-pulse" />
  )
}
