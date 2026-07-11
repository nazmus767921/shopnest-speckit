import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { anonymous, emailOTP, admin, twoFactor } from "better-auth/plugins"
import { headers } from "next/headers"
import { checkRateLimit, otpRateLimiter } from "@/lib/redis/rate-limit"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { sendSms } from "@/lib/sms"

import { rootDomain } from "@/lib/config"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      twoFactor: schema.twoFactor,
    },
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache session locally for 5 minutes
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://*.localhost:3000",
    "http://*.localhost",
    `https://*.${rootDomain}`,
  ],
  plugins: [
    anonymous({
      emailDomainName: "guest.shopnest.com.bd",
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const headersList = await headers()
        const ip = headersList.get("x-forwarded-for") || "unknown"
        const rateLimit = await checkRateLimit(otpRateLimiter, ip)
        if (!rateLimit.success) {
          throw new Error("Too many OTP requests. Please try again later.")
        }

        // Phone-as-email pattern: phone number encoded as 01XXXXXXXXX@guest.shopnest.com.bd
        const phone = email.split("@")[0]
        await sendSms({
          to: phone,
          message: `Your ShopNest verification code is: ${otp}. Valid for 10 minutes.`,
        })
      },
      otpLength: 6,
      expiresIn: 600, // 10 minutes in seconds
    }),
    admin(),
    twoFactor({
      issuer: "ShopNest",
    }),
  ],
})

