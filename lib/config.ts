/**
 * Centralized Application Configurations.
 *
 * Validates and exports required environment variables.
 * Skips throwing strict validation errors during Next.js production builds
 * to prevent build-time static evaluation crashes.
 */

const rawRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN

if (!rawRootDomain && process.env.NEXT_PHASE !== "phase-production-build") {
  throw new Error("Missing REQUIRED environment variable: NEXT_PUBLIC_ROOT_DOMAIN")
}

export const rootDomain = (rawRootDomain || "build-placeholder.com") as string

const rawTelegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
if (!rawTelegramBotUsername && process.env.NEXT_PHASE !== "phase-production-build") {
  throw new Error("Missing REQUIRED environment variable: NEXT_PUBLIC_TELEGRAM_BOT_USERNAME")
}
export const telegramBotUsername = (rawTelegramBotUsername || "shopnest_orders_bot") as string
