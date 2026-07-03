"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { confirmPayment, updateOrderStatus, getOrders } from "@/db/queries/orders"
import { revalidatePath } from "next/cache"

async function getAuthenticatedMerchant() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    throw new Error("Unauthorized. Please log in.")
  }
  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    throw new Error("Merchant account not found.")
  }
  return { merchant, session }
}

export async function getOrdersAction(params: {
  status?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  paymentMethod?: string
}) {
  try {
    const { merchant } = await getAuthenticatedMerchant()
    const ordersData = await getOrders({
      merchantId: merchant.id,
      status: params.status,
      search: params.search,
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      paymentMethod: params.paymentMethod,
    })
    return { success: true, ordersData }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch orders." }
  }
}

export async function confirmPaymentAction(orderId: string) {
  try {
    const { merchant, session } = await getAuthenticatedMerchant()
    const updatedOrder = await confirmPayment(merchant.id, orderId, session.user.id)
    
    revalidatePath("/dashboard/orders")
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, order: updatedOrder }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to confirm payment." }
  }
}

export async function updateOrderStatusAction(orderId: string, newStatus: string) {
  try {
    const { merchant } = await getAuthenticatedMerchant()
    const updatedOrder = await updateOrderStatus(merchant.id, orderId, newStatus)
    
    revalidatePath("/dashboard/orders")
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, order: updatedOrder }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update order status." }
  }
}
