import { Resend } from "resend"
import type { PlanFeatures } from "@/lib/plans/types"

// Helper to get environment variables in both Next.js and Deno
function getEnv(key: string): string {
  const globalObj = globalThis as any
  if (typeof globalObj.Deno !== "undefined") {
    return globalObj.Deno.env.get(key) || ""
  }
  return process.env[key] || ""
}

// Initialize Resend
// In Deno, we might not have the API key immediately on load if secrets are not initialized, so we wrap it
let resendInstance: Resend | null = null
function getResend() {
  if (!resendInstance) {
    const apiKey = getEnv("RESEND_API_KEY")
    // Provide a placeholder if not set to prevent SDK crash
    resendInstance = new Resend(apiKey || "re_placeholder")
  }
  return resendInstance
}

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  template: string // order_confirmed | order_shipped | order_delivered
  orderId: string
}): Promise<{ success: boolean; error?: string }> {
  const recipient = params.to
  console.log(`[EMAIL Wrapper] Attempting to send email to ${recipient} using template: ${params.template}`)

  // Guest checkout uses mock phone-as-email pattern: phone@guest.shopnest.com.bd
  if (recipient.endsWith("@guest.shopnest.com.bd")) {
    console.log(`[EMAIL Wrapper] Mocking dispatch to guest email: ${recipient}`)
    const logResult = await logEmailAttempt({
      recipientEmail: recipient,
      template: params.template,
      orderId: params.orderId,
      status: "success", // Mocked as success for guest lookup tracking
    })
    return { success: true }
  }

  try {
    const resend = getResend()
    const fromAddress = getEnv("EMAIL_FROM") || "ShopNest <onboarding@resend.dev>"

    const result = await resend.emails.send({
      from: fromAddress,
      to: [recipient],
      subject: params.subject,
      html: params.html,
    })

    if (result.error) {
      console.error("[EMAIL Wrapper] Resend API error:", result.error)
      await logEmailAttempt({
        recipientEmail: recipient,
        template: params.template,
        orderId: params.orderId,
        status: "failed",
      })
      return { success: false, error: result.error.message }
    }

    console.log(`[EMAIL Wrapper] Email sent successfully to ${recipient}, id: ${result.data?.id}`)
    await logEmailAttempt({
      recipientEmail: recipient,
      template: params.template,
      orderId: params.orderId,
      status: "success",
    })
    return { success: true }
  } catch (err: unknown) {
    console.error("[EMAIL Wrapper] Failed to send email via Resend:", err)
    const errorMsg = err instanceof Error ? err.message : "Unknown error occurred while sending email."
    
    // Log failure but never throw (Invariant 6)
    try {
      await logEmailAttempt({
        recipientEmail: recipient,
        template: params.template,
        orderId: params.orderId,
        status: "failed",
      })
    } catch (dbErr) {
      console.error("[EMAIL Wrapper] Double fault: Failed to write failed status to DB:", dbErr)
    }

    return { success: false, error: errorMsg }
  }
}

async function logEmailAttempt(data: {
  recipientEmail: string
  template: string
  orderId: string
  status: "success" | "failed"
}) {
  const recordId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15)

  const globalObj = globalThis as any
  if (typeof globalObj.Deno !== "undefined") {
    // Deno/Edge Function context - use REST API (PostgREST) to write database log
    const supabaseUrl = globalObj.Deno.env.get("SUPABASE_URL")
    const supabaseKey = globalObj.Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !supabaseKey) {
      console.error("[EMAIL Wrapper] Missing Supabase environment variables in Deno")
      return
    }

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/email_logs`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          id: recordId,
          recipient_email: data.recipientEmail,
          template: data.template,
          order_id: data.orderId,
          status: data.status,
          sent_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        console.error("[EMAIL Wrapper] PostgREST DB Logging failed:", await response.text())
      }
    } catch (fetchErr) {
      console.error("[EMAIL Wrapper] Network error logging to PostgREST in Deno:", fetchErr)
    }
  } else {
    // Next.js context - use Drizzle ORM
    try {
      const { db } = await import("@/db")
      const { emailLogs } = await import("@/db/schema")
      await db.insert(emailLogs).values({
        id: recordId,
        recipientEmail: data.recipientEmail,
        template: data.template,
        orderId: data.orderId,
        status: data.status,
      })
    } catch (drizzleErr) {
      console.error("[EMAIL Wrapper] Drizzle DB Logging failed:", drizzleErr)
    }
  }
}

export async function sendPlanChangedEmail(params: {
  merchantId: string
  newPlanName: string
  features: PlanFeatures
  pricePaisa: number
}): Promise<void> {
  // Fetch merchant user email from DB
  const { db } = await import("@/db")
  const { merchants, user } = await import("@/db/schema")
  const { eq } = await import("drizzle-orm")

  const merchant = await db.query.merchants.findFirst({
    where: eq(merchants.id, params.merchantId),
    with: { owner: true }, // requires merchantsRelations to include owner
  })

  if (!merchant?.owner?.email) {
    console.error("[sendPlanChangedEmail] Could not find merchant email for", params.merchantId)
    return
  }

  const priceTaka = Math.round(params.pricePaisa / 100)
  const fmt = (v: number | null) => (v === null ? "Unlimited" : v.toString())

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="margin-bottom:4px">Your ShopNest plan has been updated</h2>
      <p style="color:#555">Your subscription has been changed to the <strong>${params.newPlanName}</strong> plan.</p>
      <table style="border-collapse:collapse;width:100%;margin:24px 0">
        <tr><th style="text-align:left;padding:8px 12px;background:#f5f5f5">Feature</th><th style="text-align:left;padding:8px 12px;background:#f5f5f5">Your Limit</th></tr>
        <tr><td style="padding:8px 12px;border-top:1px solid #eee">Monthly price</td><td style="padding:8px 12px;border-top:1px solid #eee">৳${priceTaka}/month</td></tr>
        <tr><td style="padding:8px 12px;border-top:1px solid #eee">Products</td><td style="padding:8px 12px;border-top:1px solid #eee">${fmt(params.features.max_products)}</td></tr>
        <tr><td style="padding:8px 12px;border-top:1px solid #eee">Categories</td><td style="padding:8px 12px;border-top:1px solid #eee">${fmt(params.features.max_categories)}</td></tr>
        <tr><td style="padding:8px 12px;border-top:1px solid #eee">Orders/month</td><td style="padding:8px 12px;border-top:1px solid #eee">${fmt(params.features.max_orders_per_month)}</td></tr>
        <tr><td style="padding:8px 12px;border-top:1px solid #eee">Images per product</td><td style="padding:8px 12px;border-top:1px solid #eee">${params.features.max_images_per_product}</td></tr>
        <tr><td style="padding:8px 12px;border-top:1px solid #eee">Discount codes</td><td style="padding:8px 12px;border-top:1px solid #eee">${params.features.discount_codes ? "✓ Included" : "✗ Not included"}</td></tr>
      </table>
      <p style="color:#555;font-size:13px">Changes are effective immediately. If you have any questions, please contact ShopNest support.</p>
    </div>
  `

  const resend = getResend()
  const fromAddress = getEnv("EMAIL_FROM") || "ShopNest <onboarding@resend.dev>"

  try {
    await resend.emails.send({
      from: fromAddress,
      to: [merchant.owner.email],
      subject: `Your ShopNest plan has been updated to ${params.newPlanName}`,
      html,
    })
    console.log(`[sendPlanChangedEmail] Sent plan_changed email to ${merchant.owner.email}`)
  } catch (err) {
    // Fire-and-forget — never throw (Invariant 6)
    console.error("[sendPlanChangedEmail] Resend error:", err)
  }
}
