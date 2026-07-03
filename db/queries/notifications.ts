import { db } from "@/db"
import { notificationQueue, notificationPreferences, merchants } from "@/db/schema"
import { eq, and, inArray } from "drizzle-orm"

// ─── Notification Preferences ──────────────────────────────────────────────

/**
 * Upsert a notification preference row for a merchant.
 * Used when the merchant saves their Telegram Chat ID.
 */
export async function upsertNotificationPreference(data: {
  merchantId: string
  eventType: string
  channel: string
  enabled: boolean
}) {
  const existing = await db.query.notificationPreferences.findFirst({
    where: and(
      eq(notificationPreferences.merchantId, data.merchantId),
      eq(notificationPreferences.eventType, data.eventType),
      eq(notificationPreferences.channel, data.channel)
    ),
  })

  if (existing) {
    const [updated] = await db
      .update(notificationPreferences)
      .set({
        enabled: data.enabled,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.id, existing.id))
      .returning()
    return updated
  }

  const [created] = await db
    .insert(notificationPreferences)
    .values({
      id: crypto.randomUUID(),
      merchantId: data.merchantId,
      eventType: data.eventType,
      channel: data.channel,
      enabled: data.enabled,
    })
    .returning()
  return created
}

/**
 * Get all notification preferences for a merchant.
 */
export async function getNotificationPreferences(merchantId: string) {
  return await db.query.notificationPreferences.findMany({
    where: eq(notificationPreferences.merchantId, merchantId),
  })
}

/**
 * Disable all notification preferences for a specific channel for a merchant.
 * Used when a merchant disconnects their Telegram.
 */
export async function disableChannelPreferences(merchantId: string, channel: string) {
  await db
    .update(notificationPreferences)
    .set({ enabled: false, updatedAt: new Date() })
    .where(
      and(
        eq(notificationPreferences.merchantId, merchantId),
        eq(notificationPreferences.channel, channel)
      )
    )
}

// ─── Merchant Telegram Chat ID ─────────────────────────────────────────────

/**
 * Update a merchant's Telegram Chat ID.
 * Pass null to disconnect.
 */
export async function updateMerchantTelegramChatId(merchantId: string, chatId: string | null) {
  const [updated] = await db
    .update(merchants)
    .set({ telegramChatId: chatId })
    .where(eq(merchants.id, merchantId))
    .returning()
  return updated
}
