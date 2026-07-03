"use client"

import React, { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { saveTelegramSchema } from "@/lib/validations/notifications"
import { Button } from "@/components/ui/primitives/Button"
import { Input } from "@/components/ui/primitives/Input"
import { FormLabel } from "@/components/ui/primitives/FormLabel"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/layout/Card"
import { Badge } from "@/components/ui/primitives/Badge"
import { Dialog } from "@/components/ui"
import { toast } from "@/components/ui/feedback/Toast"
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Unlink,
  MessageCircle,
  Info,
  ExternalLink,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { telegramBotUsername } from "@/lib/config"
import type { ResolvedPlan } from "@/lib/plans/types"
import Link from "next/link"

interface NotificationsTabProps {
  merchant: {
    id: string
    plan: string
    telegramChatId?: string | null
  }
  plan: ResolvedPlan | null
}

export function NotificationsTab({ merchant, plan }: NotificationsTabProps) {
  const hasTelegram = plan?.features.telegram_notifications ?? false

  const isConnected = !!merchant.telegramChatId
  const [connected, setConnected] = useState(isConnected)
  const [connectedAt, setConnectedAt] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [pendingValue, setPendingValue] = useState<{ telegramChatId: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const executeSave = async (value: { telegramChatId: string }) => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/dashboard/notifications/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Failed to save Telegram settings.")
        return
      }

      setConnected(true)
      setConnectedAt(data.testedAt ?? new Date().toISOString())
      toast.success("Telegram connected! A test message was sent to your chat.")
      setIsConfirmModalOpen(false)
      setPendingValue(null)
    } catch {
      toast.error("Unexpected error. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const form = useForm({
    defaultValues: {
      telegramChatId: merchant.telegramChatId ?? "",
    },
    onSubmit: async ({ value }) => {
      const validation = saveTelegramSchema.safeParse(value)
      if (!validation.success) {
        toast.error(validation.error.issues[0].message)
        return
      }
      
      // Instead of submitting immediately, intercept and show the modal
      setPendingValue(validation.data)
      setIsConfirmModalOpen(true)
    },
  })

  const handleDisconnect = async () => {
    if (!connected) return
    setDisconnecting(true)
    try {
      const res = await fetch("/api/dashboard/notifications/telegram", {
        method: "DELETE",
      })
      if (!res.ok) {
        toast.error("Failed to disconnect Telegram.")
        return
      }
      setConnected(false)
      setConnectedAt(null)
      form.setFieldValue("telegramChatId", "")
      toast.success("Telegram disconnected.")
    } catch {
      toast.error("Unexpected error. Please try again.")
    } finally {
      setDisconnecting(false)
    }
  }

  if (!hasTelegram) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-8 border border-hairline-light rounded-lg bg-canvas-light">
        <div className="p-4 bg-shade-30 rounded-full mb-5">
          <Lock className="h-8 w-8 text-ink stroke-1.5" />
        </div>

        <h2 className="font-display text-heading-lg font-semibold text-ink mb-2">
          Telegram Notifications — Premium Feature
        </h2>

        <p className="text-body-md text-shade-60 max-w-md leading-relaxed mb-8">
          Get real-time order alerts sent directly to your Telegram chat. This feature
          is available on higher plans.
        </p>

        <Link href="/dashboard/billing">
          <Button variant="primary" size="md" className="flex items-center gap-2">
            <span>View Billing &amp; Plans</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ── Telegram Order Alerts Card ─────────────────────────────── */}
      <Card variant="default" className="p-6 sm:p-8 flex flex-col gap-6 rounded-2xl">
        <CardHeader className="p-0 border-b border-hairline-light pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-50 rounded-xl border border-sky-100">
                <MessageCircle className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <CardTitle className="text-heading-md font-bold text-ink">
                  Telegram Order Alerts
                </CardTitle>
                <CardDescription className="text-caption text-shade-50 mt-0.5">
                  Get notified in Telegram the moment a new order is placed.
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="mint"
              className="rounded-full px-3 py-1 text-micro font-semibold uppercase tracking-wide"
            >
              Free
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col gap-6">
          {/* Connection status banner */}
          {connected && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-caption text-emerald-800 font-medium">
                Connected
                {connectedAt
                  ? ` — test sent ${new Date(connectedAt).toLocaleString("en-BD", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`
                  : ""}
              </p>
            </div>
          )}

          {/* Setup instructions */}
          <div className="p-4 bg-canvas-cream/60 border border-hairline-light rounded-xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-shade-50 shrink-0" />
              <span className="text-caption font-semibold text-ink">
                How to find your Chat ID
              </span>
            </div>
            <ol className="flex flex-col gap-1.5 pl-6 list-decimal text-caption text-shade-50 leading-relaxed">
              <li>
                Open Telegram and search for{" "}
                <span className="font-mono font-semibold text-ink bg-shade-20 px-1 py-0.5 rounded text-micro">
                  @getmyid_bot
                </span>{" "}
                (or{" "}
                <a
                  href="https://t.me/getmyid_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline font-semibold"
                >
                  click here
                  <svg
                    className="h-3 w-3 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
                )
              </li>
              <li>
                Tap <strong className="text-ink">Start</strong> or type and send{" "}
                <strong className="text-ink">/start</strong> &rarr; the bot instantly shows your
                Chat ID
              </li>
              <li>
                Copy the number (e.g. <span className="font-mono text-ink">123456789</span>) and
                paste it below
              </li>
              <li>
                Before saving, you <strong>MUST</strong> start a chat with our bot: search for{" "}
                <a
                  href={`https://t.me/${telegramBotUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline font-semibold bg-shade-20 px-1 py-0.5 rounded text-micro"
                >
                  @{telegramBotUsername}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>{" "}
                and tap <strong className="text-ink">Start</strong>.
              </li>
              <li>
                Click <strong className="text-ink">Save & Send Test Message</strong> to connect and verify the channel.
              </li>
            </ol>
          </div>

          {/* Disclaimer callout */}
          <div className="p-4 bg-amber-50/40 border border-amber-200/40 rounded-xl flex gap-3 text-caption text-amber-800 leading-relaxed">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-amber-900">Telegram Bot Requirement</span>
              <p>
                Due to Telegram privacy rules, bots cannot message users who haven't started a conversation with them first. 
                If you have not clicked <strong>Start</strong> on{" "}
                <a
                  href={`https://t.me/${telegramBotUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold hover:text-amber-900"
                >
                  @{telegramBotUsername}
                </a>, 
                our server will be unable to send the verification message, and connection will fail.
              </p>
            </div>
          </div>

          {/* Chat ID input */}
          <form
            id="telegram-form"
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <form.Field name="telegramChatId">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <FormLabel htmlFor="telegram-chat-id">Telegram Chat ID</FormLabel>
                  <Input
                    id="telegram-chat-id"
                    type="text"
                    inputMode="numeric"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g. 123456789"
                    className="bg-canvas-cream/40 border-hairline-light focus:border-ink font-mono rounded-lg"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <p className="text-micro text-red-500">
                        {String(field.state.meta.errors[0])}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </form.Field>
          </form>
        </CardContent>

        <CardFooter className="p-0 flex items-center justify-between gap-3 flex-wrap border-t border-hairline-light pt-4">
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                form="telegram-form"
                variant="default"
                disabled={isSubmitting || isSaving}
                className="flex items-center gap-2 rounded-full"
                id="save-telegram-btn"
              >
                <Send className="h-4 w-4" />
                {isSaving ? "Saving…" : "Save & Send Test Message"}
              </Button>
            )}
          </form.Subscribe>

          {connected && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-2 text-shade-50 hover:text-red-650 rounded-full"
              id="disconnect-telegram-btn"
            >
              <Unlink className="h-4 w-4" />
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        isOpen={isConfirmModalOpen}
        onClose={() => {
          if (!isSaving) {
            setIsConfirmModalOpen(false)
            setPendingValue(null)
          }
        }}
        title="Action Required: Start Bot Chat"
        description="Telegram's privacy rules require you to initiate the conversation first."
      >
        <div className="flex flex-col gap-5">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1.5 text-body-md">
              <p>
                Before we can send your test message, you <strong>must</strong> start a chat with our bot. If you haven't done this, the connection will fail.
              </p>
              <a
                href={`https://t.me/${telegramBotUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline bg-white px-3 py-1.5 rounded-lg border border-amber-200 self-start mt-1 shadow-sm"
              >
                Open @{telegramBotUsername} in Telegram
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button
              variant="outline-light"
              onClick={() => {
                setIsConfirmModalOpen(false)
                setPendingValue(null)
              }}
              disabled={isSaving}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => pendingValue && executeSave(pendingValue)}
              disabled={isSaving}
              className="rounded-full flex items-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Yes, I've started the chat
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── Pro Plan: Notification Routing (placeholder) ───────────── */}
      {plan?.slug === "pro" && (
        <Card variant="default" className="p-6 sm:p-8 flex flex-col gap-6 rounded-2xl">
          <CardHeader className="p-0 border-b border-hairline-light pb-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-heading-md font-bold text-ink">
                Notification Routing
              </CardTitle>
              <Badge
                variant="shade"
                className="rounded-full px-3 py-1 text-micro font-semibold uppercase tracking-wide"
              >
                Pro
              </Badge>
            </div>
            <CardDescription className="text-caption text-shade-50 mt-1">
              Choose which alerts go to Telegram and which go to SMS (SMS routing available when
              enabled on your account).
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="w-full border border-hairline-light rounded-xl overflow-hidden">
              <table className="w-full text-caption">
                <thead>
                  <tr className="bg-canvas-cream/60 border-b border-hairline-light">
                    <th className="text-left px-4 py-3 font-semibold text-ink">Event</th>
                    <th className="text-center px-4 py-3 font-semibold text-ink">Telegram</th>
                    <th className="text-center px-4 py-3 font-semibold text-ink">SMS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-hairline-light">
                    <td className="px-4 py-3 text-ink font-medium">New Order</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="mint" className="rounded-full px-2.5 py-0.5 text-micro">
                        On
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-shade-40 text-micro italic">Coming soon</span>
                    </td>
                  </tr>
                  <tr className="border-b border-hairline-light">
                    <td className="px-4 py-3 text-shade-50">Payment Confirmed</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-shade-40 text-micro italic">Coming soon</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-shade-40 text-micro italic">Coming soon</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-shade-50">Low Stock</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-shade-40 text-micro italic">Coming soon</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-shade-40 text-micro italic">Coming soon</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
