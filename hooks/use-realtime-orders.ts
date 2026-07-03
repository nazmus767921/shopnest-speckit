"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

/**
 * Hook to subscribe to realtime order insertions for a given merchant.
 * Invalidates the orders query cache and calls `onNewOrder` with the new order ID.
 */
export function useRealtimeOrders(
  merchantId: string,
  onNewOrder?: (orderId: string) => void
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!merchantId) return

    const channel = supabase
      .channel(`orders:merchant:${merchantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "payment_confirmations",
          filter: `merchant_id=eq.${merchantId}`,
        },
        (payload) => {
          // Invalidate orders queries starting with ["orders", merchantId]
          queryClient.invalidateQueries({ queryKey: ["orders", merchantId] })

          // Extract the new order ID from the payment confirmation payload
          if (payload.new && typeof payload.new === "object" && "order_id" in payload.new) {
            onNewOrder?.((payload.new as { order_id: string }).order_id)
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `merchant_id=eq.${merchantId}`,
        },
        () => {
          // Invalidate orders queries starting with ["orders", merchantId]
          queryClient.invalidateQueries({ queryKey: ["orders", merchantId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [merchantId, queryClient, onNewOrder])
}
