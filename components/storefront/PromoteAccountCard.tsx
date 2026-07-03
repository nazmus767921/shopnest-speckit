"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { promoteGuestSession } from "@/app/(storefront)/[subdomain]/orders/actions"
import { Card, Button, Input, FormLabel } from "@/components/ui"
import { Sparkles, Loader2, Check, User, Mail, Lock } from "lucide-react"

interface Props {
  guestName?: string
}

export function PromoteAccountCard({ guestName = "" }: Props) {
  const router = useRouter()
  const [name, setName] = useState(guestName || "Guest Customer")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !name) {
      setError("All fields are required.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Call custom server action to promote the guest session in-place
      const res = await promoteGuestSession({
        email,
        password,
        name,
      })

      if (res?.error) {
        setError(res.error || "Failed to create account.")
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.refresh()
        }, 1500)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during account creation.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card variant="default" className="p-6 bg-aloe-10/20 border border-aloe-10/40 rounded-xl text-ink flex flex-col items-center gap-3 text-center animate-scale-up">
        <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
          <Check className="h-5 w-5 stroke-[2.5]" />
        </div>
        <div>
          <h3 className="font-semibold text-ink">Account Created!</h3>
          <p className="text-caption text-shade-60 mt-1">
            Your guest orders are now linked to <span className="font-medium">{email}</span>.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="default" className="p-6 bg-canvas-light border border-hairline-light flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-aloe-10 text-ink rounded-lg shrink-0 border border-aloe-10/20">
          <Sparkles className="h-5 w-5 text-emerald-800" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-body-strong font-bold text-ink uppercase tracking-wider">
            Save Your Order History
          </h3>
          <p className="text-caption text-shade-50">
            You are viewing this order via a guest session. Register a password-secured account to access your full history anytime, from any device.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-caption text-red-600 bg-red-50 p-3 rounded-lg border border-red-200/50">
          {error}
        </div>
      )}

      <form onSubmit={handlePromote} className="flex flex-col gap-4">
        <div>
          <FormLabel htmlFor="promote-name">Full Name</FormLabel>
          <div className="relative mt-1">
            <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-shade-40 pointer-events-none" />
            <Input
              id="promote-name"
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="promote-email">Email Address</FormLabel>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-shade-40 pointer-events-none" />
              <Input
                id="promote-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 font-sans"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <FormLabel htmlFor="promote-password">Password</FormLabel>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-shade-40 pointer-events-none" />
              <Input
                id="promote-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 font-sans"
                disabled={loading}
                required
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="mt-2 font-semibold h-11 w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              Creating Account...
            </>
          ) : (
            "Create Account & Save History"
          )}
        </Button>
      </form>
    </Card>
  )
}
