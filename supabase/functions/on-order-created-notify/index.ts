import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

/**
 * on-order-created-notify
 *
 * Triggered by a Supabase DB Webhook on `orders` table INSERT.
 * Checks if the merchant has Telegram configured and a notification
 * preference enabled for order_created. If so, enqueues a message
 * in notification_queue for the dispatch-notifications worker.
 *
 * This function must NEVER throw an unhandled error — notification
 * delivery is best-effort and must not affect order integrity.
 */
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const payload = await req.json()
    console.log("[on-order-created-notify] Received payload type:", payload.type)

    // Trigger condition: INSERT on payment_confirmations table (where TxID and method are present)
    const isTargetInsert =
      payload.type === "INSERT" &&
      payload.table === "payment_confirmations" &&
      payload.record

    if (!isTargetInsert) {
      return new Response(JSON.stringify({ message: "Condition not met. Ignored." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const payment = payload.record
    const merchantId: string = payment.merchant_id
    const orderId: string = payment.order_id
    const txId: string = payment.transaction_id ?? "Pending"
    const method: string = payment.payment_method ?? "Not specified"

    console.log(
      `[on-order-created-notify] New payment confirmation for order ${orderId}, merchant ${merchantId}`
    )

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch the order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      console.error("[on-order-created-notify] Error fetching order:", orderError)
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 200 })
    }

    // 1. Check if merchant has a Telegram Chat ID
    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .select("id, name, subdomain, telegram_chat_id")
      .eq("id", merchantId)
      .single()

    if (merchantError || !merchant || !merchant.telegram_chat_id) {
      console.log(
        `[on-order-created-notify] Merchant ${merchantId} has no Telegram chat ID. Skipping.`
      )
      return new Response(JSON.stringify({ message: "No telegram_chat_id set. Skipped." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // 2. Check notification preference for order_created + telegram
    const { data: preference, error: prefError } = await supabase
      .from("notification_preferences")
      .select("enabled")
      .eq("merchant_id", merchantId)
      .eq("event_type", "order_created")
      .eq("channel", "telegram")
      .single()

    if (prefError || !preference || !preference.enabled) {
      console.log(
        `[on-order-created-notify] Telegram preference disabled for merchant ${merchantId}. Skipping.`
      )
      return new Response(
        JSON.stringify({ message: "Telegram preference disabled. Skipped." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // 3. Fetch order items for the message payload
    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, quantity, unit_price_paisa")
      .eq("order_id", orderId)

    // 4. Build the Telegram message
    const orderRef = orderId.slice(0, 8).toUpperCase()
    const totalTaka = (order.total_paisa / 100).toFixed(2)
    const deliveryTaka = (order.delivery_charge_paisa / 100).toFixed(2)

    let itemsText = ""
    if (items && items.length > 0) {
      itemsText = items
        .map(
          (item: { product_name: string; quantity: number; unit_price_paisa: number }) =>
            `• ${item.product_name} × ${item.quantity} — ৳${(
              (item.unit_price_paisa * item.quantity) /
              100
            ).toFixed(2)}`
        )
        .join("\n")
    }

    const baseUrl = Deno.env.get("BETTER_AUTH_URL") || "https://shopnest.com.bd"
    const dashboardUrl = `${baseUrl.replace(/\/$/, "")}/dashboard/orders/${orderId}`

    const message = [
      `🛒 <b>New Order — #${orderRef}</b>`,
      ``,
      `<b>Customer:</b> ${order.delivery_name}`,
      `<b>Phone:</b> ${order.delivery_phone}`,
      `<b>Amount:</b> ৳${totalTaka}`,
      ``,
      `<b>Items:</b>`,
      itemsText || "• (no items)",
      `• Delivery — ৳${deliveryTaka}`,
      ``,
      `<b>Payment:</b> ${method}`,
      `<b>TxID:</b> ${txId}`,
      ``,
      `<a href="${dashboardUrl}">View in Dashboard →</a>`,
    ].join("\n")

    // 5. Enqueue the message
    const { error: insertError } = await supabase.from("notification_queue").insert({
      id: crypto.randomUUID(),
      merchant_id: merchantId,
      channel: "telegram",
      recipient: merchant.telegram_chat_id,
      message_payload: message,
      status: "pending",
    })

    if (insertError) {
      console.error("[on-order-created-notify] Failed to insert queue row:", insertError)
    } else {
      console.log(
        `[on-order-created-notify] Queued Telegram message for merchant ${merchantId}, order ${orderId}`
      )
    }

    return new Response(JSON.stringify({ queued: !insertError }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[on-order-created-notify] Fatal error:", message)
    // Return 200 to prevent webhook retry storms — notification is best-effort
    return new Response(JSON.stringify({ error: message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }
})
