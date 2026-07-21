"use server"

import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { banCustomer, unbanCustomer } from "@/db/queries/customers"
import { z } from "zod"

const updateStatusSchema = z.object({
  customerId: z.string(),
  banned: z.boolean(),
  banReason: z.string().optional(),
})

const banIpSchema = z.object({
  ipAddress: z.string().regex(/^[0-9a-fA-F.:]+$/, "Invalid IP address format"),
  reason: z.string().optional(),
})

export async function updateCustomerStatus(payload: z.infer<typeof updateStatusSchema>) {
  const validated = updateStatusSchema.safeParse(payload)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session || !session.user || (session.user.role !== "merchant" && session.user.role !== "admin")) {
    return { error: "Unauthorized" }
  }

  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    return { error: "Merchant not found" }
  }

  try {
    if (payload.banned) {
      await banCustomer(merchant.id, payload.customerId, payload.banReason)
    } else {
      await unbanCustomer(merchant.id, payload.customerId)
    }
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Failed to update status." }
  }
}

export async function banIpAddress(payload: z.infer<typeof banIpSchema>) {
  const validated = banIpSchema.safeParse(payload)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session || !session.user || (session.user.role !== "merchant" && session.user.role !== "admin")) {
    return { error: "Unauthorized" }
  }

  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    return { error: "Merchant not found" }
  }

  try {
    const { banIpAddress: dbBanIp } = await import("@/db/queries/customers")
    await dbBanIp(merchant.id, payload.ipAddress, payload.reason)
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Failed to ban IP address." }
  }
}

export async function unbanIpAddressAction(ipAddress: string) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session || !session.user || (session.user.role !== "merchant" && session.user.role !== "admin")) {
    return { error: "Unauthorized" }
  }

  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    return { error: "Merchant not found" }
  }

  try {
    const { unbanIpAddress: dbUnbanIp } = await import("@/db/queries/customers")
    await dbUnbanIp(merchant.id, ipAddress)
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Failed to unban IP address." }
  }
}

export async function addCustomerNoteAction(customerId: string, content: string) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session || !session.user || (session.user.role !== "merchant" && session.user.role !== "admin")) {
    return { error: "Unauthorized" }
  }
  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) return { error: "Merchant not found" }

  try {
    const { addCustomerNote } = await import("@/db/queries/customers")
    await addCustomerNote(merchant.id, customerId, session.user.id, content)
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Failed to add note." }
  }
}

export async function deleteCustomerAction(customerId: string) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session || !session.user || (session.user.role !== "merchant" && session.user.role !== "admin")) {
    return { error: "Unauthorized" }
  }
  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) return { error: "Merchant not found" }

  try {
    const { deleteCustomerAccount } = await import("@/db/queries/customers")
    await deleteCustomerAccount(merchant.id, customerId)
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Failed to delete account." }
  }
}


export async function exportCustomerDataCsvAction(customerId: string) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session || !session.user || (session.user.role !== "merchant" && session.user.role !== "admin")) {
    return { error: "Unauthorized" }
  }
  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) return { error: "Merchant not found" }

  try {
    const { getCustomerDataForExport } = await import("@/db/queries/customers")
    const data = await getCustomerDataForExport(merchant.id, customerId)
    
    let csv = "Order ID,Status,Total Taka,Date\n"
    data.orders.forEach((o) => {
      csv += `"${o.id}","${o.status}","${(o.totalPaisa / 100).toFixed(2)}","${o.createdAt.toISOString()}"\n`
    })

    return { success: true, csv }
  } catch (err: any) {
    return { error: err.message || "Failed to export data." }
  }
}
