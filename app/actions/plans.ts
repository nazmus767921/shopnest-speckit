"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { revalidatePath } from "next/cache"
import { planSchema } from "@/lib/validations/plans"
import {
  createPlan,
  updatePlan,
  archivePlan,
  unarchivePlan,
} from "@/db/queries/plans"

async function assertAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    throw new Error("Unauthorized. Please log in.")
  }
  const isAdmin = session.user.role === "admin" || session.user.email === "admin@shopnest.com.bd"
  if (!isAdmin) {
    throw new Error("Forbidden. Access restricted to platform admins.")
  }
  return session
}

export async function createPlanAction(values: unknown) {
  try {
    await assertAdmin()
    const result = planSchema.safeParse(values)
    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }
    const plan = await createPlan(result.data)
    revalidatePath("/admin/plans")
    revalidatePath("/")
    return { success: true, plan }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create plan." }
  }
}

export async function updatePlanAction(planId: string, values: unknown) {
  try {
    await assertAdmin()
    // For updates, the slug is immutable, so we validate without requiring slug
    const updateSchema = planSchema.omit({ slug: true }).partial()
    const result = updateSchema.safeParse(values)
    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }
    const plan = await updatePlan(planId, result.data)
    revalidatePath("/admin/plans")
    revalidatePath("/")
    return { success: true, plan }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update plan." }
  }
}

export async function archivePlanAction(planId: string) {
  try {
    await assertAdmin()
    const plan = await archivePlan(planId)
    revalidatePath("/admin/plans")
    revalidatePath("/")
    return { success: true, plan }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to archive plan." }
  }
}

export async function unarchivePlanAction(planId: string) {
  try {
    await assertAdmin()
    const plan = await unarchivePlan(planId)
    revalidatePath("/admin/plans")
    revalidatePath("/")
    return { success: true, plan }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to restore plan." }
  }
}
