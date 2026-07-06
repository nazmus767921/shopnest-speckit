import { db } from "@/db"
import { orders, orderItems, paymentConfirmations, products, merchants, productVariants } from "@/db/schema"
import { eq, ne, exists, and, inArray, gte, sql, isNull, desc, asc, count, or, like } from "drizzle-orm"
import { assertPlanLimit } from "@/lib/plans/assertPlan"
import { syncParentProductStock } from "./products"

export async function createOrder(params: {
  merchantId: string
  userId: string | null
  guestPhone: string | null
  deliveryName: string
  deliveryPhone: string
  deliveryAddress: string
  deliveryCity: string
  deliveryChargePaisa: number
  items: Array<{ productId: string; quantity: number; variantId?: string; variantLabel?: string }>
}): Promise<{ orderId: string; totalPaisa: number } | { error: string }> {
  if (params.items.length === 0) {
    return { error: "Cart is empty." }
  }

  try {
    // Invariant 7: Enforce monthly order limit based on plan
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [monthlyCount] = await db
      .select({ value: count() })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, params.merchantId),
          gte(orders.createdAt, startOfMonth)
        )
      )

    const monthlyOrderCount = monthlyCount?.value ?? 0

    await assertPlanLimit(
      params.merchantId,
      "max_orders_per_month",
      monthlyOrderCount,
      (limit) => `This store has reached its monthly order limit of ${limit} orders. Please contact the store owner.`
    )

    return await db.transaction(async (tx) => {
      // 1. Fetch product rows inside the transaction with a FOR UPDATE lock
      const productIds = params.items.map((i) => i.productId)
      const productRows = await tx
        .select()
        .from(products)
        .where(
          and(
            inArray(products.id, productIds),
            eq(products.merchantId, params.merchantId), // Invariant 1
            eq(products.isPublished, true),
            isNull(products.deletedAt)
          )
        )
        .for("update") // Row-level lock

      // 2. Verify all products exist and check stock_count >= quantity (Invariant 2)
      //    For variant items, check variant stock instead of product stock.
      const resolvedItems: Array<{
        productId: string;
        productName: string;
        variantId: string | null;
        variantLabel: string | null;
        quantity: number;
        unitPricePaisa: number;
      }> = []

      for (const item of params.items) {
        const product = productRows.find((p) => p.id === item.productId)
        if (!product) {
          throw new Error(`Product not found or unavailable.`)
        }

        let unitPricePaisa = product.pricePaisa

        if (item.variantId) {
          // For variant items, check variant-level stock and resolve unit price
          const [variant] = await tx
            .select({
              stockCount: productVariants.stockCount,
              pricePaisa: productVariants.pricePaisa,
            })
            .from(productVariants)
            .where(
              and(
                eq(productVariants.id, item.variantId),
                eq(productVariants.merchantId, params.merchantId),
                eq(productVariants.isActive, true),
              ),
            )
            .for("update")

          if (!variant) {
            throw new Error(`"${product.name}" variant is no longer available.`)
          }

          if (variant.stockCount < item.quantity) {
            throw new Error(`"${product.name}" variant is out of stock. Please remove it from your cart and try again.`)
          }

          if (variant.pricePaisa !== null) {
            unitPricePaisa = variant.pricePaisa
          }
        } else {
          // For base products, check product-level stock
          if (product.stockCount < item.quantity) {
            throw new Error(`"${product.name}" only has ${product.stockCount} left in stock.`)
          }
        }

        resolvedItems.push({
          productId: item.productId,
          productName: product.name,
          variantId: item.variantId ?? null,
          variantLabel: item.variantLabel ?? null,
          quantity: item.quantity,
          unitPricePaisa,
        })
      }

      // 3. Compute total order cost
      const itemsSubtotal = resolvedItems.reduce((sum, item) => {
        return sum + item.unitPricePaisa * item.quantity
      }, 0)

      const totalPaisa = itemsSubtotal + params.deliveryChargePaisa

      // 4. Insert order row
      const orderId = crypto.randomUUID()
      await tx.insert(orders).values({
        id: orderId,
        merchantId: params.merchantId,
        userId: params.userId,
        guestPhone: params.guestPhone,
        status: "pending_payment",
        deliveryName: params.deliveryName,
        deliveryPhone: params.deliveryPhone,
        deliveryAddress: params.deliveryAddress,
        deliveryCity: params.deliveryCity,
        deliveryChargePaisa: params.deliveryChargePaisa,
        totalPaisa,
        discountPaisa: 0,
      })

      // 5. Insert order items (snapshot product name and unit price — Invariant 3)
      const orderItemsValues = resolvedItems.map((item) => {
        return {
          id: crypto.randomUUID(),
          orderId,
          merchantId: params.merchantId,
          productId: item.productId,
          productName: item.productName, // Snapshotted
          unitPricePaisa: item.unitPricePaisa, // Snapshotted (Invariant 3) — variant price or base price
          quantity: item.quantity,
          variantId: item.variantId,
          variantLabel: item.variantLabel,
        }
      })
      await tx.insert(orderItems).values(orderItemsValues)

      // 6. Decrement stock counts with a final safety check (Invariant 2)
      for (const item of params.items) {
        if (item.variantId) {
          // Decrement variant stock (Invariant 2 extended to variant stock)
          const updateResult = await tx
            .update(productVariants)
            .set({
              stockCount: sql`${productVariants.stockCount} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(productVariants.id, item.variantId),
                eq(productVariants.merchantId, params.merchantId), // Invariant 1
                gte(productVariants.stockCount, item.quantity), // Invariant 2 DB-layer guard
              ),
            )
            .returning()

          if (updateResult.length === 0) {
            throw new Error("This variant just went out of stock. Please remove it from your cart and try again.")
          }

          // Sync parent product stock
          await syncParentProductStock(tx, item.productId)
        } else {
          // Decrement base product stock
          const updateResult = await tx
            .update(products)
            .set({
              stockCount: sql`stock_count - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(products.id, item.productId),
                eq(products.merchantId, params.merchantId), // Invariant 1
                gte(products.stockCount, item.quantity), // Invariant 2 DB-layer guard
              ),
            )
            .returning()

          if (updateResult.length === 0) {
            throw new Error("This item just went out of stock. Please remove it from your cart and try again.")
          }
        }
      }

      return { orderId, totalPaisa }
    })
  } catch (err: unknown) {
    console.error("Error creating order in transaction:", err)
    const errorMsg = err instanceof Error ? err.message : "Failed to create order due to a database error."
    return { error: errorMsg }
  }
}

export async function attachPaymentConfirmation(params: {
  orderId: string
  merchantId: string // Invariant 1
  paymentMethod: "bkash" | "nagad" | "cod"
  transactionId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure the order belongs to this merchant
    const existingOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, params.orderId),
        eq(orders.merchantId, params.merchantId)
      )
    })

    if (!existingOrder) {
      return { success: false, error: "Order not found." }
    }

    await db.insert(paymentConfirmations).values({
      id: crypto.randomUUID(),
      orderId: params.orderId,
      merchantId: params.merchantId,
      paymentMethod: params.paymentMethod,
      transactionId: params.transactionId,
    })

    return { success: true }
  } catch (err: unknown) {
    console.error("Error attaching payment confirmation:", err)
    const errorMsg = err instanceof Error ? err.message : "Failed to save payment transaction ID."
    return { success: false, error: errorMsg }
  }
}

export async function getOrders(params: {
  merchantId: string
  status?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  paymentMethod?: string
}) {
  const page = params.page || 1
  const limit = params.limit || 20
  const offset = (page - 1) * limit

  // We need to build the where clause
  const conditions = [eq(orders.merchantId, params.merchantId)]

  if (params.status && params.status !== "all") {
    conditions.push(eq(orders.status, params.status))
  }

  if (params.search) {
    const searchPattern = `%${params.search}%`
    const searchCondition = or(
      eq(orders.id, params.search),
      like(orders.guestPhone, searchPattern),
      like(orders.deliveryPhone, searchPattern),
      like(orders.deliveryName, searchPattern)
    )
    if (searchCondition) {
      conditions.push(searchCondition)
    }
  }

  // Filter out orders that are pending payment but have no payment confirmation (abandoned checkout drafts)
  const existsConfirmation = exists(
    db
      .select()
      .from(paymentConfirmations)
      .where(eq(paymentConfirmations.orderId, orders.id))
  )
  conditions.push(
    or(
      ne(orders.status, "pending_payment"),
      existsConfirmation
    )!
  )

  // Filter by payment method
  if (params.paymentMethod && params.paymentMethod !== "all") {
    const paymentMethodCondition = exists(
      db
        .select()
        .from(paymentConfirmations)
        .where(
          and(
            eq(paymentConfirmations.orderId, orders.id),
            eq(paymentConfirmations.paymentMethod, params.paymentMethod)
          )
        )
    )
    conditions.push(paymentMethodCondition)
  }

  const whereClause = and(...conditions)

  // Determine sort order
  let orderByClause = [desc(orders.createdAt)]
  if (params.sortBy) {
    switch (params.sortBy) {
      case "oldest":
        orderByClause = [asc(orders.createdAt)]
        break
      case "total_asc":
        orderByClause = [asc(orders.totalPaisa)]
        break
      case "total_desc":
        orderByClause = [desc(orders.totalPaisa)]
        break
      case "newest":
      default:
        orderByClause = [desc(orders.createdAt)]
        break
    }
  }

  const items = await db.query.orders.findMany({
    where: whereClause,
    orderBy: orderByClause,
    limit,
    offset,
    with: {
      paymentConfirmation: true,
      items: true
    }
  })

  // Get total count of filtered orders
  const [countResult] = await db
    .select({ value: count() })
    .from(orders)
    .where(whereClause)

  const totalCount = countResult?.value || 0

  // Get counts by status globally for this merchant (excluding abandoned drafts)
  const countWhereClause = and(
    eq(orders.merchantId, params.merchantId),
    or(
      ne(orders.status, "pending_payment"),
      existsConfirmation
    )!
  )

  const statusCounts = await db
    .select({
      status: orders.status,
      count: count(),
    })
    .from(orders)
    .where(countWhereClause)
    .groupBy(orders.status)

  const counts: Record<string, number> = {
    all: 0,
    pending_payment: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }

  let total = 0
  for (const row of statusCounts) {
    counts[row.status] = row.count
    total += row.count
  }
  counts.all = total

  return {
    items,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    counts
  }
}

export async function getOrderDetails(merchantId: string, orderId: string) {
  return await db.query.orders.findFirst({
    where: and(
      eq(orders.merchantId, merchantId),
      eq(orders.id, orderId)
    ),
    with: {
      paymentConfirmation: true,
      items: {
        with: {
          product: {
            with: {
              images: {
                orderBy: (images, { asc }) => [asc(images.displayOrder)],
              }
            }
          }
        }
      }
    }
  })
}

export async function confirmPayment(merchantId: string, orderId: string, confirmedByUserId: string) {
  return await db.transaction(async (tx) => {
    // 1. Get the order and make sure it belongs to the merchant
    const existingOrder = await tx.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.merchantId, merchantId)
      )
    })

    if (!existingOrder) {
      throw new Error("Order not found.")
    }

    if (existingOrder.status !== "pending_payment") {
      throw new Error("Only pending orders can have their payments confirmed.")
    }

    // 2. Update payment_confirmations.confirmed_at and confirmed_by
    await tx
      .update(paymentConfirmations)
      .set({
        confirmedAt: new Date(),
        confirmedBy: confirmedByUserId
      })
      .where(
        and(
          eq(paymentConfirmations.orderId, orderId),
          eq(paymentConfirmations.merchantId, merchantId)
        )
      )

    // 3. Update orders.status to 'processing'
    const [updatedOrder] = await tx
      .update(orders)
      .set({
        status: "processing",
        updatedAt: new Date()
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.merchantId, merchantId)
        )
      )
      .returning()

    return updatedOrder
  })
}

export async function updateOrderStatus(merchantId: string, orderId: string, newStatus: string) {
  const validStatuses = ["pending_payment", "processing", "shipped", "delivered", "cancelled", "returned"]
  if (!validStatuses.includes(newStatus)) {
    throw new Error("Invalid status.")
  }

  return await db.transaction(async (tx) => {
    const existingOrder = await tx.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.merchantId, merchantId)
      )
    })

    if (!existingOrder) {
      throw new Error("Order not found.")
    }

    // Progression validation:
    // e.g. Cannot go from pending_payment directly to shipped or delivered.
    if (existingOrder.status === "pending_payment" && (newStatus === "shipped" || newStatus === "delivered")) {
      throw new Error("Must confirm payment before shipping or delivering.")
    }

    // If cancelled or returned, and was not previously cancelled/returned, restore stock counts
    if ((newStatus === "cancelled" || newStatus === "returned") && 
        existingOrder.status !== "cancelled" && 
        existingOrder.status !== "returned") {
      const items = await tx.query.orderItems.findMany({
        where: eq(orderItems.orderId, orderId)
      })

      for (const item of items) {
        if (item.variantId) {
          // For variant items, restore variant stock (symmetrical to createOrder)
          await tx
            .update(productVariants)
            .set({
              stockCount: sql`${productVariants.stockCount} + ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(and(
              eq(productVariants.id, item.variantId),
              eq(productVariants.merchantId, merchantId),
            ))

          // Sync parent product stock
          await syncParentProductStock(tx, item.productId)
        } else {
          // For base products, restore product stock (symmetrical to createOrder)
          await tx
            .update(products)
            .set({
              stockCount: sql`stock_count + ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(eq(products.id, item.productId))
        }
      }
    }

    // Auto-confirm COD payments on delivery (FR-009)
    if (newStatus === "delivered") {
      const confirmation = await tx.query.paymentConfirmations.findFirst({
        where: and(
          eq(paymentConfirmations.orderId, orderId),
          eq(paymentConfirmations.merchantId, merchantId)
        )
      })
      if (confirmation && confirmation.paymentMethod === "cod" && !confirmation.confirmedAt) {
        await tx
          .update(paymentConfirmations)
          .set({
            confirmedAt: new Date()
          })
          .where(
            and(
              eq(paymentConfirmations.orderId, orderId),
              eq(paymentConfirmations.merchantId, merchantId)
            )
          )
      }
    }

    const returningResult = await tx
      .update(orders)
      .set({
        status: newStatus,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.merchantId, merchantId)
        )
      )
      .returning()

    const [updatedOrder] = returningResult

    return updatedOrder
  })
}

export async function getCustomerOrders(merchantId: string, userId: string, phone?: string) {
  const conditions = [
    eq(orders.merchantId, merchantId)
  ]
  if (phone) {
    conditions.push(
      or(
        eq(orders.userId, userId),
        eq(orders.guestPhone, phone),
        eq(orders.deliveryPhone, phone)
      )!
    )
  } else {
    conditions.push(eq(orders.userId, userId))
  }

  // Filter out abandoned checkout drafts (pending payment but no payment confirmation)
  const existsConfirmation = exists(
    db
      .select()
      .from(paymentConfirmations)
      .where(eq(paymentConfirmations.orderId, orders.id))
  )
  conditions.push(
    or(
      ne(orders.status, "pending_payment"),
      existsConfirmation
    )!
  )

  return await db.query.orders.findMany({
    where: and(...conditions),
    orderBy: [desc(orders.createdAt)],
    with: {
      paymentConfirmation: true,
      items: true
    }
  })
}

export async function getCustomerOrderDetails(merchantId: string, orderId: string, userId: string, phone?: string) {
  const accessConditions = [
    eq(orders.userId, userId)
  ]
  if (phone) {
    accessConditions.push(
      eq(orders.guestPhone, phone),
      eq(orders.deliveryPhone, phone)
    )
  }

  return await db.query.orders.findFirst({
    where: and(
      eq(orders.merchantId, merchantId),
      eq(orders.id, orderId),
      or(...accessConditions)
    ),
    with: {
      paymentConfirmation: true,
      items: {
        with: {
          product: {
            with: {
              images: {
                orderBy: (images, { asc }) => [asc(images.displayOrder)],
              }
            }
          }
        }
      }
    }
  })
}
