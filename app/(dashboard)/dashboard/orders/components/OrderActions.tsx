"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { confirmPaymentAction, updateOrderStatusAction } from "../actions"
import { CheckCircle2Icon, TruckIcon, CheckIcon, XCircleIcon } from "@/lib/icons";


interface OrderActionsProps {
  orderId: string
  status: string
}

export function OrderActions({ orderId, status }: OrderActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogConfig, setDialogConfig] = useState<{
    title: string
    description: string
    onConfirm: () => void
    confirmText: string
    variant: "primary" | "danger" | "emerald"
  } | null>(null)

  const closeDialog = () => setDialogOpen(false)

  const handleAction = (actionFn: () => Promise<{ success: boolean; error?: string }>) => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await actionFn()
        if (res.success) {
          router.refresh()
        } else {
          setError(res.error || "An error occurred.")
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.")
      }
    })
  }

  const openConfirmation = (config: {
    title: string
    description: string
    onConfirm: () => void
    confirmText: string
    variant: "primary" | "danger" | "emerald"
  }) => {
    setDialogConfig(config)
    setDialogOpen(true)
  }

  const onConfirmPayment = () => {
    openConfirmation({
      title: "Confirm Payment",
      description: "Have you verified this transaction in your bKash/Nagad merchant statement? Confirming will update the status to processing and send an email receipt to the customer.",
      confirmText: "Confirm Payment",
      variant: "emerald",
      onConfirm: () => {
        setDialogOpen(false)
        handleAction(() => confirmPaymentAction(orderId))
      }
    })
  }

  const onMarkAsShipped = () => {
    openConfirmation({
      title: "Mark as Shipped",
      description: "Are you sure you want to mark this order as shipped? This will update the status and notify the customer via email.",
      confirmText: "Mark as Shipped",
      variant: "primary",
      onConfirm: () => {
        setDialogOpen(false)
        handleAction(() => updateOrderStatusAction(orderId, "shipped"))
      }
    })
  }

  const onMarkAsDelivered = () => {
    openConfirmation({
      title: "Mark as Delivered",
      description: "Are you sure this order has been successfully delivered to the customer? This will finalize the order.",
      confirmText: "Mark as Delivered",
      variant: "emerald",
      onConfirm: () => {
        setDialogOpen(false)
        handleAction(() => updateOrderStatusAction(orderId, "delivered"))
      }
    })
  }

  const onCancelOrder = () => {
    openConfirmation({
      title: "Cancel Order",
      description: "Are you sure you want to cancel this order? This will restore the product stock counts and cannot be undone.",
      confirmText: "Cancel Order",
      variant: "danger",
      onConfirm: () => {
        setDialogOpen(false)
        handleAction(() => updateOrderStatusAction(orderId, "cancelled"))
      }
    })
  }

  const onMarkAsReturned = () => {
    openConfirmation({
      title: "Mark as Returned",
      description: "Are you sure you want to mark this order as returned? This will update the status to returned and restore all allocated stock counts to inventory.",
      confirmText: "Mark as Returned",
      variant: "danger",
      onConfirm: () => {
        setDialogOpen(false)
        handleAction(() => updateOrderStatusAction(orderId, "returned"))
      }
    })
  }

  if (status === "delivered" || status === "cancelled" || status === "returned") {
    return null
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-caption font-medium">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {status === "pending_payment" && (
          <>
            <Button
              variant="default"
              onClick={onConfirmPayment}
              disabled={isPending}
              className="gap-2 shrink-0 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white! text-caption min-h-10 cursor-pointer border-none"
            >
              <CheckCircle2Icon className="h-4 w-4" />
              Confirm Payment
            </Button>
            <Button
              variant="outline"
              onClick={onCancelOrder}
              disabled={isPending}
              className="gap-2 text-caption min-h-10 hover:text-rose-700 hover:border-rose-200 cursor-pointer"
            >
              <XCircleIcon className="h-4 w-4" />
              Cancel Order
            </Button>
          </>
        )}

        {status === "processing" && (
          <>
            <Button
              variant="default"
              onClick={onMarkAsShipped}
              disabled={isPending}
              className="gap-2 w-full md:w-fit shrink-0 text-caption min-h-10 cursor-pointer"
            >
              <TruckIcon className="h-4 w-4" />
              Mark as Shipped
            </Button>
            <Button
              variant="outline"
              onClick={onMarkAsReturned}
              disabled={isPending}
              className="gap-2 w-full md:w-fit text-caption min-h-10 hover:text-purple-700 hover:border-purple-200 cursor-pointer"
            >
              <XCircleIcon className="h-4 w-4" />
              Mark as Returned
            </Button>
            <Button
              variant="outline"
              onClick={onCancelOrder}
              disabled={isPending}
              className="gap-2 w-full md:w-fit text-caption min-h-10 hover:text-rose-700 hover:border-rose-200 cursor-pointer"
            >
              <XCircleIcon className="h-4 w-4" />
              Cancel Order
            </Button>
          </>
        )}

        {status === "shipped" && (
          <>
            <Button
              variant="default"
              onClick={onMarkAsDelivered}
              disabled={isPending}
              className="gap-2 shrink-0 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-caption min-h-10 cursor-pointer border-none"
            >
              <CheckIcon className="h-4 w-4" />
              Mark as Delivered
            </Button>
            <Button
              variant="outline"
              onClick={onMarkAsReturned}
              disabled={isPending}
              className="gap-2 text-caption min-h-10 hover:text-purple-700 hover:border-purple-200 cursor-pointer"
            >
              <XCircleIcon className="h-4 w-4" />
              Mark as Returned
            </Button>
          </>
        )}
      </div>

      {dialogConfig && (
        <ConfirmDialog
          isOpen={dialogOpen}
          onClose={closeDialog}
          onConfirm={dialogConfig.onConfirm}
          title={dialogConfig.title}
          description={dialogConfig.description}
          confirmText={dialogConfig.confirmText}
          variant={dialogConfig.variant}
          isPending={isPending}
        />
      )}
    </div>
  )
}
