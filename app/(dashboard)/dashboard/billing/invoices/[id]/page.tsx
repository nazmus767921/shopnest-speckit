import React from "react"
import { notFound } from "next/navigation"
import { db } from "@/db"
import { subscriptionPayments, merchants, subscriptions } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { InvoiceActions } from "./InvoiceActions"

export const metadata = {
  title: "Invoice — ShopNest",
}

import { Suspense } from "react"

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

  // Fetch the specific payment for this merchant
  const payment = await db.query.subscriptionPayments.findFirst({
    where: and(
      eq(subscriptionPayments.id, id),
      eq(subscriptionPayments.merchantId, merchant.id),
      eq(subscriptionPayments.status, "verified")
    ),
  })

  if (!payment) return notFound()

  // Find the subscription to display the plan if needed
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
    <div className="max-w-3xl mx-auto p-8 bg-white text-ink print:p-0">
      <div className="flex items-center justify-between mb-12">
        <div className="flex flex-col">
          <h1 className="text-display-sm font-semibold tracking-tight text-ink">INVOICE</h1>
          <p className="text-body-md text-shade-50">#{invoiceNumber}</p>
        </div>
        <div className="text-right">
          <h2 className="text-heading-md font-bold text-primary">ShopNest</h2>
          <p className="text-caption text-shade-60">Dhaka, Bangladesh</p>
          <p className="text-caption text-shade-60">billing@shopnest.com.bd</p>
        </div>
      </div>

      <div className="flex justify-between items-start border-b border-hairline-light pb-8 mb-8">
        <div>
          <p className="text-micro font-bold text-shade-40 uppercase tracking-wider mb-2">Billed To</p>
          <p className="text-body-md font-semibold text-ink">{merchant.name}</p>
          <p className="text-caption text-shade-60">{merchant.subdomain}.shopnest.com.bd</p>
        </div>
        <div className="text-right">
          <p className="text-micro font-bold text-shade-40 uppercase tracking-wider mb-2">Payment Date</p>
          <p className="text-body-md font-medium text-ink">{dateStr}</p>
          
          <p className="text-micro font-bold text-shade-40 uppercase tracking-wider mb-2 mt-4">Payment Method</p>
          <p className="text-body-md font-medium text-ink capitalize">{payment.paymentMethod} (TxID: {payment.transactionId})</p>
        </div>
      </div>

      <table className="w-full mb-12 text-left">
        <thead>
          <tr className="border-b border-hairline-light">
            <th className="py-3 text-micro font-bold text-shade-40 uppercase tracking-wider">Description</th>
            <th className="py-3 text-micro font-bold text-shade-40 uppercase tracking-wider text-center">Months</th>
            <th className="py-3 text-micro font-bold text-shade-40 uppercase tracking-wider text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-hairline-light">
            <td className="py-4 text-body-md text-ink">ShopNest {subscription?.plan || merchant.plan} Plan Subscription</td>
            <td className="py-4 text-body-md text-ink text-center">{payment.months}</td>
            <td className="py-4 text-body-md font-mono text-ink text-right">৳ {amountTaka}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="py-4 text-right text-body-strong font-semibold text-ink">Total Paid</td>
            <td className="py-4 text-right text-heading-lg font-mono font-bold text-ink">৳ {amountTaka}</td>
          </tr>
        </tfoot>
      </table>

      <div className="text-center pt-8 border-t border-hairline-light">
        <p className="text-caption text-shade-50">Thank you for building your business with ShopNest.</p>
        <p className="text-micro text-shade-40 mt-1">This is a computer-generated invoice and requires no signature.</p>
      </div>

      {/* Non-printable back/print buttons */}
      <InvoiceActions />
    </div>
  )
}

function InvoiceSkeleton() {
  return (
    <div className="max-w-3xl mx-auto p-8 bg-white border border-hairline-light rounded-lg h-96 w-full animate-pulse" />
  )
}

