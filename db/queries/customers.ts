import { db } from "@/db"
import { user, customerAddresses, bannedIps, orders } from "@/db/schema"
import { eq, and, sql, desc, count, like, or } from "drizzle-orm"

export async function getCustomersByMerchant(
  merchantId: string,
  options: { search?: string; limit?: number; offset?: number } = {}
) {
  const { search, limit = 50, offset = 0 } = options

  let whereClause = and(
    eq(user.merchantId, merchantId),
    eq(user.role, "customer")
  )

  if (search) {
    whereClause = and(
      whereClause,
      or(
        like(user.name, `%${search}%`),
        like(user.email, `%${search}%`)
      )
    )
  }

  const result = await db
    .select()
    .from(user)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(user.createdAt))

  const totalCountResult = await db
    .select({ count: count() })
    .from(user)
    .where(whereClause)

  return {
    customers: result,
    totalCount: totalCountResult[0]?.count ?? 0,
  }
}

export async function getCustomerDetails(merchantId: string, customerId: string) {
  const customer = await db.query.user.findFirst({
    where: and(
      eq(user.id, customerId),
      eq(user.merchantId, merchantId),
      eq(user.role, "customer")
    ),
    with: {
      customerAddresses: true,
    },
  })

  if (!customer) {
    return null
  }

  // Fetch customer orders lifetime spend
  const spendResult = await db
    .select({
      totalSpend: sql<number>`COALESCE(SUM(${orders.totalPaisa}), 0)::integer`,
      ordersCount: count(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.merchantId, merchantId),
        eq(orders.userId, customerId)
      )
    )

  const stats = spendResult[0] || { totalSpend: 0, ordersCount: 0 }

  return {
    ...customer,
    totalSpend: stats.totalSpend,
    ordersCount: stats.ordersCount,
  }
}

export async function saveCustomerAddress(
  userId: string,
  merchantId: string,
  data: {
    id?: string
    name: string
    phone: string
    address: string
    city: string
    isDefault?: boolean
  }
) {
  // If set to default, unset other default addresses first
  if (data.isDefault) {
    await db
      .update(customerAddresses)
      .set({ isDefault: false })
      .where(
        and(
          eq(customerAddresses.userId, userId),
          eq(customerAddresses.merchantId, merchantId)
        )
      )
  }

  if (data.id) {
    const [updated] = await db
      .update(customerAddresses)
      .set({
        name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        isDefault: !!data.isDefault,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customerAddresses.id, data.id),
          eq(customerAddresses.userId, userId),
          eq(customerAddresses.merchantId, merchantId)
        )
      )
      .returning()
    return updated
  } else {
    const [inserted] = await db
      .insert(customerAddresses)
      .values({
        id: crypto.randomUUID(),
        userId,
        merchantId,
        name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        isDefault: !!data.isDefault,
      })
      .returning()
    return inserted
  }
}

export async function banCustomer(merchantId: string, customerId: string, reason?: string) {
  return await db
    .update(user)
    .set({
      banned: true,
      banReason: reason ?? "Suspended by merchant admin",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(user.id, customerId),
        eq(user.merchantId, merchantId)
      )
    )
}

export async function unbanCustomer(merchantId: string, customerId: string) {
  return await db
    .update(user)
    .set({
      banned: false,
      banReason: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(user.id, customerId),
        eq(user.merchantId, merchantId)
      )
    )
}

export async function banIpAddress(merchantId: string, ipAddress: string, reason?: string) {
  const [banned] = await db
    .insert(bannedIps)
    .values({
      id: crypto.randomUUID(),
      merchantId,
      ipAddress,
      reason: reason ?? "Banned by merchant admin",
    })
    .onConflictDoUpdate({
      target: [bannedIps.merchantId, bannedIps.ipAddress],
      set: {
        reason: reason ?? "Banned by merchant admin",
      },
    })
    .returning()
  return banned
}

export async function unbanIpAddress(merchantId: string, ipAddress: string) {
  return await db
    .delete(bannedIps)
    .where(
      and(
        eq(bannedIps.merchantId, merchantId),
        eq(bannedIps.ipAddress, ipAddress)
      )
    )
}

export async function isIpBanned(merchantId: string, ipAddress: string): Promise<boolean> {
  const banned = await db.query.bannedIps.findFirst({
    where: and(
      eq(bannedIps.merchantId, merchantId),
      eq(bannedIps.ipAddress, ipAddress)
    ),
  })
  return !!banned
}

export async function bindGuestOrdersToUser(
  userId: string,
  email: string | null,
  phone: string | null,
  merchantId: string
) {
  // Extract clean original email if it contains merchant suffix
  let cleanEmail = null
  if (email) {
    // If email is john+merchantId@example.com, extract john@example.com
    cleanEmail = email.includes("+") ? email.split("+")[0] + "@" + email.split("@")[1] : email
  }

  const conditions = []

  if (cleanEmail) {
    conditions.push(eq(orders.guestPhone, cleanEmail)) // in case email was used as guestPhone
  }

  if (phone) {
    conditions.push(eq(orders.guestPhone, phone))
    conditions.push(eq(orders.deliveryPhone, phone))
  }

  if (conditions.length === 0) {
    return [] // Nothing to bind
  }

  // Also match anonymous users mapped by email
  const anonymousUsers = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(
        eq(user.isAnonymous, true),
        or(
          cleanEmail ? eq(user.email, cleanEmail) : undefined,
          phone ? eq(user.email, `${phone}@guest.shopnest.com.bd`) : undefined
        )
      )
    )

  if (anonymousUsers.length > 0) {
    const anonIds = anonymousUsers.map((u) => u.id)
    conditions.push(sql`${orders.userId} IN ${anonIds}`)
  }

  return await db
    .update(orders)
    .set({
      userId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(orders.merchantId, merchantId),
        or(...conditions)
      )
    )
}
