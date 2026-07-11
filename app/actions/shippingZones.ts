"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import {
  createShippingZone,
  deleteShippingZone,
} from "@/db/queries/shippingZones"
import { shippingZoneSchema } from "@/lib/validations/shippingZones"
import { revalidatePath, revalidateTag } from "next/cache"

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
  return merchant
}

export async function createShippingZoneAction(input: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()

    // Validate inputs
    const validation = shippingZoneSchema.safeParse(input)
    if (!validation.success) {
      throw new Error(validation.error.issues[0].message)
    }

    const newZone = await createShippingZone({
      merchantId: merchant.id,
      name: validation.data.name,
      deliveryChargePaisa: validation.data.deliveryChargePaisa,
      freeShippingThresholdPaisa: validation.data.freeShippingThresholdPaisa,
      districts: validation.data.districts,
    })

    revalidatePath("/dashboard/settings")
    return { success: true, zone: newZone }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create shipping zone." }
  }
}

export async function deleteShippingZoneAction(input: { id: string }) {
  try {
    const merchant = await getAuthenticatedMerchant()

    await deleteShippingZone({
      id: input.id,
      merchantId: merchant.id, // Invariant 1
    })

    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete shipping zone." }
  }
}


