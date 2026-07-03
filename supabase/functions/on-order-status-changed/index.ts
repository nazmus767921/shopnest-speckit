import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import { sendEmail } from "../_shared/email.ts"

Deno.serve(async (req) => {
  // Database Webhooks are POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const payload = await req.json()
    console.log("[Webhook on-order-status-changed] Received payload type:", payload.type)

    // Trigger condition: table update on orders where status transitions to 'shipped' or 'delivered'
    const isTargetUpdate = 
      payload.type === "UPDATE" &&
      payload.table === "orders" &&
      payload.record &&
      payload.old_record &&
      payload.record.status !== payload.old_record.status &&
      (payload.record.status === "shipped" || payload.record.status === "delivered")

    if (!isTargetUpdate) {
      console.log("[Webhook on-order-status-changed] Status change trigger conditions not met, ignoring.")
      return new Response(JSON.stringify({ message: "Condition not met. Ignored." }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }

    const order = payload.record
    const orderId = order.id
    const merchantId = order.merchant_id
    const newStatus = order.status

    console.log(`[Webhook on-order-status-changed] Processing status update to '${newStatus}' for order: ${orderId}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Fetch Merchant Details
    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .select("*")
      .eq("id", merchantId)
      .single()

    if (merchantError || !merchant) {
      console.error("[Webhook on-order-status-changed] Error fetching merchant:", merchantError)
      return new Response(JSON.stringify({ error: "Merchant not found" }), { status: 404 })
    }

    // 2. Fetch Order Items
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)

    if (itemsError || !items) {
      console.error("[Webhook on-order-status-changed] Error fetching order items:", itemsError)
      return new Response(JSON.stringify({ error: "Order items not found" }), { status: 404 })
    }

    // 3. Resolve Customer Email
    let customerEmail = ""
    let customerName = order.delivery_name || "Customer"

    if (order.user_id) {
      const { data: userRecord, error: userError } = await supabase
        .from("user")
        .select("email, name")
        .eq("id", order.user_id)
        .single()

      if (!userError && userRecord) {
        customerEmail = userRecord.email
        if (userRecord.name) {
          customerName = userRecord.name
        }
      }
    }

    // Fallback if no user record/email exists
    if (!customerEmail) {
      customerEmail = order.guest_phone 
        ? `${order.guest_phone}@guest.shopnest.com.bd` 
        : `${order.delivery_phone}@guest.shopnest.com.bd`
    }

    console.log(`[Webhook on-order-status-changed] Email recipient resolved: ${customerEmail}`)

    // 4. Construct Order Items HTML list
    let orderItemsHtml = ""
    items.forEach((item) => {
      const rowTotal = "৳" + ((item.unit_price_paisa * item.quantity) / 100).toFixed(2)
      orderItemsHtml += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; border-bottom: 1px solid #f4f4f5; padding-bottom: 8px;">
          <span style="color: #52525b;">${item.product_name} <strong>× ${item.quantity}</strong></span>
          <span style="font-family: monospace; font-weight: bold; color: #000;">${rowTotal}</span>
        </div>
      `
    })

    const totalAmountText = "৳" + (order.total_paisa / 100).toFixed(2)
    const trackingBaseUrl = Deno.env.get("BETTER_AUTH_URL") || "http://localhost:3000"
    const urlObj = new URL(trackingBaseUrl)
    const isLocalhost = urlObj.hostname.includes("localhost")
    const trackingUrl = isLocalhost
      ? `http://${merchant.subdomain}.localhost:3000/orders/${orderId}`
      : `https://${merchant.subdomain}.${urlObj.hostname}/orders/${orderId}`

    // 5. Template Customizations based on status
    const statusLabel = newStatus === "shipped" ? "Shipped" : "Delivered"
    const subjectLine = newStatus === "shipped" 
      ? `Your order has shipped! — ${merchant.name}`
      : `Your order has been delivered! — ${merchant.name}`

    const messageBody = newStatus === "shipped"
      ? `Exciting news! Your package has been dispatched from **${merchant.name}** and is on its way to your delivery address. You can expect it shortly.`
      : `Hooray! Your order from **${merchant.name}** has been marked as delivered. We hope you love your new boutique clothing purchase! Thank you for shopping with us.`

    // 6. Generate Email HTML Template (Matching DESIGN.md aesthetic)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${statusLabel} - ${merchant.name}</title>
        <style>
          body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #fbfbf5; color: #000000; margin: 0; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; }
          .header { padding: 32px; background-color: #000000; color: #ffffff; text-align: center; }
          .header h1 { font-family: 'NeueHaasGrotesk Display', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 330; margin: 0; letter-spacing: 0.5px; text-transform: uppercase; }
          .content { padding: 32px; }
          .status-badge { display: inline-block; padding: 6px 16px; background-color: #c1fbd4; color: #000000; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 24px; border: 1px solid rgba(0,0,0,0.05); }
          .order-details { margin: 24px 0; border-top: 1px solid #e4e4e7; border-bottom: 1px solid #e4e4e7; padding: 16px 0; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 16px; border-top: 1px dashed #e4e4e7; padding-top: 16px; }
          .button-container { text-align: center; margin-top: 32px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff !important; text-decoration: none; border-radius: 9999px; font-weight: 500; font-size: 14px; }
          .footer { padding: 24px 32px; background-color: #ffffff; border-top: 1px solid #e4e4e7; text-align: center; font-size: 12px; color: #a1a1aa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${merchant.name}</h1>
          </div>
          <div class="content">
            <span class="status-badge">${statusLabel}</span>
            <h2 style="margin-top: 0; font-family: 'NeueHaasGrotesk Display', sans-serif; font-weight: 400; font-size: 20px;">Hi ${customerName},</h2>
            <p style="color: #52525b; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
              ${messageBody}
            </p>
            
            <div class="order-details">
              <h4 style="margin-top: 0; margin-bottom: 16px; text-transform: uppercase; font-size: 11px; color: #71717a; tracking-wider: 1px;">Order Summary</h4>
              ${orderItemsHtml}
              <div class="total-row">
                <span>Total Value</span>
                <span style="font-family: monospace;">${totalAmountText}</span>
              </div>
            </div>
            
            <div class="button-container">
              <a href="${trackingUrl}" class="button">Track Your Order</a>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 ${merchant.name}. Powered by ShopNest.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // 6. Dispatch Email via lib/email.ts
    const emailResult = await sendEmail({
      to: customerEmail,
      subject: subjectLine,
      html: emailHtml,
      template: `order_${newStatus}`,
      orderId: orderId
    })

    return new Response(JSON.stringify({ 
      success: emailResult.success, 
      error: emailResult.error || null 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error in webhook"
    console.error("[Webhook on-order-status-changed] Fatal error:", errorMsg)
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
