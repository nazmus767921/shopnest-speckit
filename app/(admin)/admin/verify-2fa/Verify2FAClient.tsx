"use client"

import React, { useState } from "react"
import { authClient } from "@/lib/auth/auth-client"
import { ShieldIcon, Loader2Icon, KeyIcon } from "@/lib/icons";

export function Verify2FAClient() {
  const [code, setCode] = useState("")
  const [backupCode, setBackupCode] = useState("")
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let res
      if (useBackupCode) {
        res = await authClient.twoFactor.verifyBackupCode({
          code: backupCode.trim(),
          trustDevice: true,
        })
      } else {
        res = await authClient.twoFactor.verifyTotp({
          code: code,
          trustDevice: true,
        })
      }

      if (res.error) {
        setError(res.error.message || "Verification failed. Check your code and try again.")
      } else {
        // Redirect to admin overview page
        window.location.href = "/admin"
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-canvas-light border border-hairline-light rounded-xl p-8 flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
          <ShieldIcon className="h-6 w-6" />
        </div>
        <h1 className="font-display text-heading-xl font-semibold tracking-tight text-ink">
          2-Step Verification
        </h1>
        <p className="text-caption text-shade-50 font-light">
          {useBackupCode 
            ? "Enter one of your 10-character backup recovery codes to log in."
            : "Enter the verification code from your authenticator app."
          }
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-md text-caption text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="flex flex-col gap-5">
        {useBackupCode ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-eyebrow-cap font-semibold text-shade-50 uppercase">
              Backup Recovery Code
            </label>
            <input
              type="text"
              required
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value)}
              placeholder="e.g. abc123xyz8"
              className="w-full text-body-md border border-hairline-light rounded-md px-3.5 py-2.5 bg-canvas-light text-ink focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono text-center uppercase"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-eyebrow-cap font-semibold text-shade-50 uppercase text-center">
              Security Code
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
        )}

        <button
          type="submit"
          disabled={loading || (!useBackupCode && code.length !== 6) || (useBackupCode && backupCode.length < 5)}
          className="w-full py-2.5 bg-black text-white hover:bg-zinc-800 rounded-full text-body-strong font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
          Verify and Log In
        </button>
      </form>

      <div className="text-center pt-2 border-t border-hairline-light/60">
        <button
          type="button"
          onClick={() => {
            setUseBackupCode(!useBackupCode)
            setError(null)
          }}
          className="text-caption text-emerald-800 font-semibold hover:underline flex items-center justify-center gap-1.5 w-full"
        >
          <KeyIcon className="h-3.5 w-3.5" />
          {useBackupCode ? "Use Authenticator App" : "Use Backup Recovery Code"}
        </button>
      </div>
    </div>
  )
}
