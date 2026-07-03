"use client"

import React, { useState } from "react"
import { authClient } from "@/lib/auth/auth-client"
import { QRCodeSVG } from "qrcode.react"
import { Shield, Key, Eye, EyeOff, Check, Clipboard, Loader2 } from "lucide-react"

export function Setup2FAClient() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState("")
  const [step, setStep] = useState(1) // 1: Password verify, 2: Scan QR, 3: Backup codes
  const [totpURI, setTotpURI] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await authClient.twoFactor.enable({
        password: password,
      })

      if (res.error) {
        setError(res.error.message || "Failed to initiate 2FA. Verify your password.")
      } else if (res.data) {
        setTotpURI(res.data.totpURI)
        setBackupCodes(res.data.backupCodes)
        setStep(2)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await authClient.twoFactor.verifyTotp({
        code: code,
        trustDevice: true,
      })

      if (res.error) {
        setError(res.error.message || "Invalid 2FA code. Please try again.")
      } else {
        setStep(3)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full max-w-md bg-canvas-light border border-hairline-light rounded-xl p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="font-display text-heading-xl font-semibold tracking-tight text-ink">
          Configure Admin 2FA
        </h1>
        <p className="text-caption text-shade-50 font-light">
          Platform administrators must protect accounts with Two-Factor Authentication.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-md text-caption text-center">
          {error}
        </div>
      )}

      {/* Step 1: Password Verification */}
      {step === 1 && (
        <form onSubmit={handleEnable} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-eyebrow-cap font-semibold text-shade-50 uppercase">
              Enter Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-body-md border border-hairline-light rounded-md px-3.5 py-2.5 bg-canvas-light text-ink pr-10 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-shade-40 hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-black text-white hover:bg-zinc-800 rounded-full text-body-strong font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enable Authenticator
          </button>
        </form>
      )}

      {/* Step 2: Scan QR & Verify */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4 bg-canvas-cream/35 p-5 rounded-2xl border border-hairline-light">
            <QRCodeSVG value={totpURI} size={180} />
            <div className="text-center flex flex-col gap-1">
              <span className="text-caption text-ink font-semibold">Scan QR Code</span>
              <span className="text-micro text-shade-50 max-w-xs">
                Scan this code in Google Authenticator, 1Password, or any other TOTP app.
              </span>
            </div>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-eyebrow-cap font-semibold text-shade-50 uppercase text-center">
                6-Digit Security Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000 000"
                className="w-full text-center tracking-[0.25em] text-heading-xl font-mono border border-hairline-light rounded-md px-3 py-2 bg-canvas-light text-ink focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 border border-ink text-ink hover:bg-canvas-cream rounded-full text-body-strong font-medium transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 py-2.5 bg-black text-white hover:bg-zinc-800 rounded-full text-body-strong font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify Code
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Success & Backup Codes */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-800 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-body-strong text-emerald-800 font-semibold">
                2FA Enabled Successfully!
              </span>
              <span className="text-caption text-emerald-700 font-light">
                Your admin account is now secured with authenticator verification.
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-eyebrow-cap font-semibold text-shade-50 uppercase">
                Backup Recovery Codes
              </label>
              <button
                type="button"
                onClick={copyBackupCodes}
                className="text-micro text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
              >
                {copied ? "Copied!" : (
                  <>
                    <Clipboard className="h-3 w-3" /> Copy all
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-canvas-cream/50 p-4 border border-hairline-light rounded-2xl font-mono text-body-md text-ink grid grid-cols-2 gap-2 text-center">
              {backupCodes.map((c, i) => (
                <div key={i} className="py-1 bg-canvas-light border border-hairline-light/50 rounded-xl text-shade-70 font-semibold">
                  {c}
                </div>
              ))}
            </div>
            <p className="text-micro text-shade-50 text-center mt-1">
              Store these backup codes safely. They can be used to log in if you lose your authenticator.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/admin"
            }}
            className="w-full py-2.5 bg-black text-white hover:bg-zinc-800 rounded-full text-body-strong font-medium transition"
          >
            Go to Admin Panel
          </button>
        </div>
      )}
    </div>
  )
}
