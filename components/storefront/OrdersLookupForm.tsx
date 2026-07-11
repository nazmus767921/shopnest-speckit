"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { authClient } from "@/lib/auth/auth-client"
import { Button, Input, FormLabel, Card } from "@/components/ui"
import { ShieldCheckIcon, Loader2Icon, KeyRoundIcon, PhoneIcon, LogInIcon } from "@/lib/icons";

interface Props {
  merchantId: string
  merchantName: string
}

export function OrdersLookupForm({ merchantId, merchantName }: Props) {
  const router = useRouter()
  const params = useParams()
  const subdomain = params.subdomain as string

  const [phone, setPhone] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpCodes, setOtpCodes] = useState<string[]>(Array(6).fill(""))
  const [timer, setTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) return
    const id = setInterval(() => {
      setTimer((t) => t - 1)
    }, 1000)
    return () => clearInterval(id)
  }, [timer])

  const isValidPhone = /^01[3-9]\d{8}$/.test(phone)

  const handleSendOtp = async () => {
    if (!isValidPhone) {
      setError("Please enter a valid Bangladeshi mobile number (e.g., 01712345678).")
      return
    }

    setLoading(true)
    setError("")

    try {
      const email = `${phone}@guest.shopnest.com.bd`
      const res = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      })

      if (res?.error) {
        setError(res.error.message || "Failed to send verification code.")
      } else {
        setOtpSent(true)
        setTimer(60)
        setTimeout(() => {
          inputRefs.current[0]?.focus()
        }, 100)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, val: string) => {
    const numericVal = val.replace(/[^0-9]/g, "")
    if (!numericVal && val !== "") return

    const newCodes = [...otpCodes]
    newCodes[index] = numericVal.slice(-1)
    setOtpCodes(newCodes)

    if (numericVal && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCodes[index] && index > 0) {
      const newCodes = [...otpCodes]
      newCodes[index - 1] = ""
      setOtpCodes(newCodes)
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOtp = async () => {
    const fullOtp = otpCodes.join("")
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const email = `${phone}@guest.shopnest.com.bd`
      const res = await authClient.signIn.emailOtp({
        email,
        otp: fullOtp,
        name: "Guest Customer",
      })

      if (res?.error) {
        setError(res.error.message || "Invalid or expired verification code.")
      } else {
        // Success: refresh to update the server component which detects cookie session
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during verification.")
    } finally {
      setLoading(false)
    }
  }

  // Handle redirecting to general login for registered customers
  const handleRegisteredLogin = () => {
    const callbackUrl = encodeURIComponent(`http://${subdomain}.localhost:3000/orders`)
    // Better Auth will redirect back after success
    window.location.href = `/login?callbackURL=${callbackUrl}`
  }

  return (
    <div className="max-w-md mx-auto py-12 animate-fade-in">
      <Card variant="default" className="p-8 flex flex-col gap-6 bg-canvas-light border border-hairline-light">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="font-display text-heading-xl font-light text-ink tracking-tight leading-none uppercase">
            Track Your Order
          </h2>
          <p className="text-caption text-shade-50">
            Enter your mobile number to verify your identity and view order tracking details.
          </p>
        </div>

        {error && (
          <div className="text-caption text-red-600 bg-red-50 p-3 rounded-lg border border-red-200/50">
            {error}
          </div>
        )}

        {!otpSent ? (
          <div className="flex flex-col gap-4">
            <div>
              <FormLabel htmlFor="tracking-phone">Mobile Number</FormLabel>
              <div className="relative mt-1">
                <PhoneIcon className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-shade-40 pointer-events-none" />
                <Input
                  id="tracking-phone"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-11"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              disabled={!isValidPhone || loading}
              onClick={handleSendOtp}
              className="w-full mt-2 font-semibold h-11"
            >
              {loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-1.5" />
                  Sending Code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div className="flex items-center gap-2 text-caption text-shade-60">
              <ShieldCheckIcon className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
              <span>
                Code sent to <span className="font-mono font-medium text-ink">{phone}</span>
              </span>
            </div>

            <div>
              <FormLabel>Enter 6-Digit Code</FormLabel>
              <div className="flex gap-2.5 justify-between max-w-sm mt-2">
                {otpCodes.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el }}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={loading}
                    className="w-12 h-12 text-center text-heading-lg font-bold rounded-lg border border-hairline-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-canvas-light text-ink shrink-0"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-2">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={timer > 0 || loading}
                className="text-caption text-shade-50 hover:text-ink disabled:opacity-40 disabled:hover:text-shade-50 font-medium transition-colors"
              >
                {timer > 0 ? `Resend Code (${timer}s)` : "Resend Code"}
              </button>

              <Button
                type="button"
                variant="primary"
                onClick={handleVerifyOtp}
                disabled={loading || otpCodes.some((c) => !c)}
                className="h-10 px-5 font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin mr-1.5" />
                    Verifying...
                  </>
                ) : (
                  "Verify & View"
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="relative flex py-2 items-center">
          <div className="grow border-t border-hairline-light"></div>
          <span className="shrink mx-4 text-xs text-shade-40 font-semibold uppercase tracking-wider">Or</span>
          <div className="grow border-t border-hairline-light"></div>
        </div>

        <Button
          type="button"
          variant="outline-light"
          onClick={handleRegisteredLogin}
          className="w-full flex items-center justify-center gap-2 font-medium h-11"
        >
          <LogInIcon className="h-4 w-4" />
          <span>Login with Email & Password</span>
        </Button>
      </Card>
    </div>
  )
}
