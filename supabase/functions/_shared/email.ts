import { Resend } from "npm:resend@^6.16.0"

// Helper to get environment variables in Deno Edge Function context
function getEnv(key: string): string {
  return Deno.env.get(key) || ""
}

// Initialize Resend lazily
let resendInstance: Resend | null = null
function getResend() {
  if (!resendInstance) {
    const apiKey = getEnv("RESEND_API_KEY")
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
    await logEmailAttempt({
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
  const recordId = crypto.randomUUID()
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!supabaseUrl || !supabaseKey) {
    console.error("[EMAIL Wrapper] Missing Supabase environment variables")
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
    console.error("[EMAIL Wrapper] Network error logging to PostgREST:", fetchErr)
  }
}
