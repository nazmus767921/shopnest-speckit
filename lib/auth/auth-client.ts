import { createAuthClient } from "better-auth/react"
import { anonymousClient, emailOTPClient, adminClient, twoFactorClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [
    anonymousClient(),
    emailOTPClient(),
    adminClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/admin/verify-2fa"
      },
    }),
  ],
})

