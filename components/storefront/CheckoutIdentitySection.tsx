"use client"

import React, { useEffect, useState, useRef } from "react"
import { authClient } from "@/lib/auth/auth-client"
import { Button, Input, FormLabel } from "@/components/ui"
import { ShieldCheck, Loader2 } from "lucide-react"

interface Props {
  phone: string
  merchantId: string
  onVerified: () => void
}

export function CheckoutIdentitySection({ phone, merchantId, onVerified }: Props) {
  const [session, setSession] = useState<{ user: { name: string; email: string } } | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  
  const [otpSent, setOtpSent] = useState(false)
  const [otpCodes, setOtpCodes] = useState<string[]>(Array(6).fill(""))
  const [timer, setTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  // Load session on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await authClient.getSession()
        if (res?.data?.session) {
          setSession(res.data)
          // If we are logged in, trigger verification immediately
          onVerified()
        }
      } catch (err) {
        console.error("Failed to load session:", err)
      } finally {
        setSessionLoading(false)
      }
    }
    loadSession()
  }, [onVerified])

  // Reset OTP state when phone changes (guest re-verification)
  useEffect(() => {
    setOtpSent(false)
    setOtpCodes(Array(6).fill(""))
    setError("")
    setTimer(0)
  }, [phone])

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) return
    const id = setInterval(() => {
      setTimer((t) => t - 1)
    }, 1000)
    return () => clearInterval(id)
  }, [timer])

  const isValidPhone = /^01[3-9]\d{8}$/.test(phone)

  // Send OTP handler
  const handleSendOtp = async () => {
    if (!isValidPhone) {
      setError("Please enter a valid Bangladeshi mobile number (e.g., 01712345678) first.")
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
        // Focus first OTP field
        setTimeout(() => {
          inputRefs.current[0]?.focus()
        }, 100)
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred."
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Handle individual OTP input changes
  const handleOtpChange = (index: number, val: string) => {
    // Only allow single numeric chars
    const numericVal = val.replace(/[^0-9]/g, "")
    if (!numericVal && val !== "") return

    const newCodes = [...otpCodes]
    newCodes[index] = numericVal.slice(-1)
    setOtpCodes(newCodes)

    // Advance focus if value typed
    if (numericVal && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCodes[index] && index > 0) {
      // Focus previous input on backspace
      const newCodes = [...otpCodes]
      newCodes[index - 1] = ""
      setOtpCodes(newCodes)
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Verify OTP handler
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
        // Success: reload session and notify parent
        const sessionRes = await authClient.getSession()
        setSession(sessionRes?.data as any || null)
        onVerified()
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred during verification."
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (sessionLoading) {
    return (
      <div className="flex items-center gap-2 text-caption text-shade-50">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Checking verification state...</span>
      </div>
    )
  }

  if (session) {
    const displayName = session.user?.name || "Customer"
    const displayEmail = session.user?.email || ""
    const displayPhone = displayEmail.endsWith("@guest.shopnest.com.bd") 
      ? displayEmail.split("@")[0] 
      : displayEmail

    return (
      <div className="flex items-center gap-3 p-4 bg-aloe-10/20 border border-aloe-10/40 rounded-xl text-ink">
        <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
        <div className="text-caption">
          <p className="font-semibold text-ink">Identity Verified</p>
          <p className="text-shade-60 text-xs">
            Continuing as <span className="font-mono font-medium">{displayPhone}</span> ({displayName})
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 border border-hairline-light rounded-xl p-6 bg-canvas-light">
      <div className="flex flex-col gap-1">
        <h3 className="text-body-strong font-semibold text-ink">
          Verify Phone Number
        </h3>
        <p className="text-caption text-shade-50">
          We will send a 6-digit SMS verification code to check your identity.
        </p>
      </div>

      {error && (
        <div className="text-caption text-red-600 bg-red-50 p-3 rounded-lg border border-red-200/50">
          {error}
        </div>
      )}

      {!otpSent ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="grow">
            <FormLabel htmlFor="identity-phone">Verification Phone</FormLabel>
            <Input
              id="identity-phone"
              type="text"
              placeholder="01XXXXXXXXX"
              value={phone}
              disabled={true} // Linked to the form field directly
              className="bg-zinc-50"
            />
          </div>
          <Button
            type="button"
            variant="outline-light"
            disabled={!isValidPhone || loading}
            onClick={handleSendOtp}
            className="h-11 shrink-0 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Sending...
              </>
            ) : (
              "Send Code"
            )}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div>
            <FormLabel>Enter 6-Digit Code</FormLabel>
            <div className="flex gap-2.5 justify-between max-w-sm mt-1.5">
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

          <div className="flex items-center justify-between gap-4">
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
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
