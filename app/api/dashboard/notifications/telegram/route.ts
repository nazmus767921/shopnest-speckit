import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { rootDomain } from "@/lib/config"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import {
  updateMerchantTelegramChatId,
  upsertNotificationPreference,
  disableChannelPreferences,
} from "@/db/queries/notifications"
import { saveTelegramSchema } from "@/lib/validations/notifications"
import { getCachedMerchantPlan } from "@/lib/cache/plans"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// ─── POST /api/dashboard/notifications/telegram ───────────────────────────
// Save Chat ID, upsert preference, fire synchronous test message.

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const merchant = await getMerchantByOwnerId(session.user.id)
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }

    const plan = await getCachedMerchantPlan(merchant.id)
    if (!plan || !plan.features.telegram_notifications) {
      return NextResponse.json(
        { error: "Telegram notifications are not enabled on your current plan. Upgrade to access this feature." },
        { status: 403 }
      )
    }

    const body = await req.json()

    // Validate chat ID format
    const validation = saveTelegramSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { telegramChatId } = validation.data

    if (!TELEGRAM_BOT_TOKEN) {
      console.error("[Telegram API] TELEGRAM_BOT_TOKEN is not configured.")
      return NextResponse.json(
        { error: "Telegram integration is not configured on this server." },
        { status: 503 }
      )
    }

    const isLocalhost = process.env.NODE_ENV === "development"
    const storefrontUrl = isLocalhost
      ? `http://${merchant.subdomain}.localhost:3000`
      : `https://${merchant.subdomain}.${rootDomain}`

    // Fire synchronous test message BEFORE saving — gives instant feedback on invalid IDs
    const testPayload = {
      chat_id: telegramChatId,
      text: [
        `✅ <b>Connected — ${merchant.name}</b>`,
        ``,
        `Your store is now linked to ShopNest order alerts.`,
        `Every new order placed on <a href="${storefrontUrl}">${merchant.subdomain}.${rootDomain}</a> will be sent here.`,
        ``,
        `<i>Powered by ShopNest 🛒</i>`,
      ].join("\n"),
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    }


    const telegramRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload),
      }
    )

    if (!telegramRes.ok) {
      const errJson = await telegramRes.json().catch(() => ({}))
      console.error("[Telegram API] Test message failed:", errJson)
      return NextResponse.json(
        {
          error:
            "We couldn't reach that Chat ID. Make sure you've started a chat with our bot first, then try again.",
        },
        { status: 422 }
      )
    }

    // Persist Chat ID and preferences only after successful test message
    await updateMerchantTelegramChatId(merchant.id, telegramChatId)

    await upsertNotificationPreference({
      merchantId: merchant.id,
      eventType: "order_created",
      channel: "telegram",
      enabled: true,
    })

    const testedAt = new Date().toISOString()

    return NextResponse.json({ connected: true, testedAt }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error"
    console.error("[POST /api/dashboard/notifications/telegram]", message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ─── DELETE /api/dashboard/notifications/telegram ────────────────────────
// Disconnect Telegram: clear chat ID and disable all telegram preferences.

export async function DELETE(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const merchant = await getMerchantByOwnerId(session.user.id)
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }

    await updateMerchantTelegramChatId(merchant.id, null)
    await disableChannelPreferences(merchant.id, "telegram")

    return NextResponse.json({ disconnected: true }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error"
    console.error("[DELETE /api/dashboard/notifications/telegram]", message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
