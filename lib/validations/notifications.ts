import { z } from "zod"

/**
 * Zod schema for the Telegram Chat ID field.
 * Telegram Chat IDs are 7–13 digit integers.
 * Personal chats are positive; group/channel IDs start with a negative sign.
 */
export const telegramChatIdSchema = z
  .string()
  .trim()
  .min(1, "Chat ID is required.")
  .regex(
    /^-?\d{7,13}$/,
    "Invalid Chat ID. It should be a 7–13 digit number (e.g. 123456789). Find it via @getmyid_bot in Telegram."
  )

export const saveTelegramSchema = z.object({
  telegramChatId: telegramChatIdSchema,
})

export type SaveTelegramInput = z.infer<typeof saveTelegramSchema>
