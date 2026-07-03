"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchCustomerOrders } from "@/app/(storefront)/[subdomain]/orders/actions"

/**
 * Custom TanStack Query hook to fetch order history for the currently logged-in customer/guest.
 */
export function useCustomerOrders() {
  return useQuery({
    queryKey: ["customer-orders"],
    queryFn: async () => {
      return await fetchCustomerOrders()
    },
    staleTime: 10 * 1000, // 10 seconds stale time (customer orders page can be refreshed or auto-fetched reasonably)
  })
}
