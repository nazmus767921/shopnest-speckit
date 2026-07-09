"use client"

import React, { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { saveTelegramSchema } from "@/lib/validations/notifications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label as FormLabel } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
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
import { cn } from "@/lib/utils"

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
      
      setPendingValue(validation.data)
      setIsConfirmModalOpen(true)
    },
  })

  const handleDisconnect = async () => {
    if (!connected) return
    setConnected(false)
    setConnectedAt(null)
    form.setFieldValue("telegramChatId", "")
    toast.success("Telegram disconnected.")
  }

  if (!hasTelegram) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-8 border border-border rounded-xl bg-card">
        <div className="p-4 bg-muted rounded-full mb-5">
          <Lock className="h-8 w-8 text-foreground stroke-1.5" />
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">
          Telegram Notifications — Premium Feature
        </h2>

        <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-8">
          Get real-time order alerts sent directly to your Telegram chat. This feature
          is available on higher plans.
        </p>

        <Link href="/dashboard/billing">
          <Button className="flex items-center gap-2 rounded-md">
            <span>View Billing &amp; Plans</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-foreground">
      {/* ── Telegram Order Alerts Card ─────────────────────────────── */}
      <Card className="p-6 sm:p-8 flex flex-col gap-6 rounded-xl border border-border">
        <CardHeader className="p-0 border-b border-border pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-50 dark:bg-sky-950/20 rounded-lg border border-sky-100 dark:border-sky-950">
                <MessageCircle className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Telegram Order Alerts
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-0.5">
                  Get notified in Telegram the moment a new order is placed.
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="default"
              className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            >
              Free
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col gap-6">
          {/* Connection status banner */}
          {connected && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
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
          <div className="p-4 bg-muted/10 border border-border rounded-lg flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold text-foreground">
                How to find your Chat ID
              </span>
            </div>
            <ol className="flex flex-col gap-1.5 pl-6 list-decimal text-sm text-muted-foreground leading-relaxed">
              <li>
                Open Telegram and search for{" "}
                <span className="font-mono font-semibold text-foreground bg-muted px-1 py-0.5 rounded text-xs">
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
                Tap <strong className="text-foreground">Start</strong> or type and send{" "}
                <strong className="text-foreground">/start</strong> &rarr; the bot instantly shows your
                Chat ID
              </li>
              <li>
                Copy the number (e.g. <span className="font-mono text-foreground">123456789</span>) and
                paste it below
              </li>
              <li>
                Before saving, you <strong>MUST</strong> start a chat with our bot: search for{" "}
                <a
                  href={`https://t.me/${telegramBotUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline font-semibold bg-muted px-1 py-0.5 rounded text-xs"
                >
                  @{telegramBotUsername}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>{" "}
                and tap <strong className="text-foreground">Start</strong>.
              </li>
              <li>
                Click <strong className="text-foreground">Save & Send Test Message</strong> to connect and verify the channel.
              </li>
            </ol>
          </div>

          {/* Disclaimer callout */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-amber-900 dark:text-amber-300">Telegram Bot Requirement</span>
              <p>
                Due to Telegram privacy rules, bots cannot message users who haven't started a conversation with them first. 
                If you have not clicked <strong>Start</strong> on{" "}
                <a
                  href={`https://t.me/${telegramBotUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-300"
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
                    className="bg-background border-border font-mono rounded-lg"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <p className="text-xs text-red-500">
                        {String(field.state.meta.errors[0])}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </form.Field>
          </form>
        </CardContent>

        <CardFooter className="p-0 flex items-center justify-between gap-3 flex-wrap border-t border-border pt-4">
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                form="telegram-form"
                disabled={isSubmitting || isSaving}
                className="flex items-center gap-2 rounded-md"
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
              className="flex items-center gap-2 text-muted-foreground hover:text-destructive rounded-md"
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
        open={isConfirmModalOpen}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setIsConfirmModalOpen(false)
            setPendingValue(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Action Required: Start Bot Chat</DialogTitle>
            <DialogDescription>
              Telegram's privacy rules require you to initiate the conversation first.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3 text-amber-900 dark:text-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1.5 text-sm">
                <p>
                  Before we can send your test message, you <strong>must</strong> start a chat with our bot. If you haven't done this, the connection will fail.
                </p>
                <a
                  href={`https://t.me/${telegramBotUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline bg-background px-3 py-1.5 rounded-lg border border-border self-start mt-1 shadow-sm"
                >
                  Open @{telegramBotUsername} in Telegram
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmModalOpen(false)
                setPendingValue(null)
              }}
              disabled={isSaving}
              className="rounded-md"
            >
              Cancel
            </Button>
            <Button
              onClick={() => pendingValue && executeSave(pendingValue)}
              disabled={isSaving}
              className="rounded-md flex items-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Yes, I've started the chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Pro Plan: Notification Routing (placeholder) ───────────── */}
      {plan?.slug === "pro" && (
        <Card className="p-6 sm:p-8 flex flex-col gap-6 rounded-xl border border-border">
          <CardHeader className="p-0 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg font-bold text-foreground">
                Notification Routing
              </CardTitle>
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              >
                Pro
              </Badge>
            </div>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Choose which alerts go to Telegram and which go to SMS (SMS routing available when
              enabled on your account).
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="w-full border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Event</th>
                    <th className="text-center px-4 py-3 font-semibold text-foreground">Telegram</th>
                    <th className="text-center px-4 py-3 font-semibold text-foreground">SMS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-foreground font-medium">New Order</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="default" className="rounded-full px-2.5 py-0.5 text-xs">
                        On
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-muted-foreground text-xs italic">Coming soon</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-muted-foreground">Payment Confirmed</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-muted-foreground text-xs italic">Coming soon</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-muted-foreground text-xs italic">Coming soon</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Low Stock</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-muted-foreground text-xs italic">Coming soon</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-muted-foreground text-xs italic">Coming soon</span>
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
