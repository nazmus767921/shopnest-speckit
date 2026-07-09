"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react"

export type ToastType = "success" | "error" | "info" | "loading"

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number // ms, default: 4000
  dismissable?: boolean // default: true
}

export interface ToastOptions {
  duration?: number
  dismissable?: boolean
}

export interface ToastPromiseMessages {
  loading: string
  success: string
  error: string
}

interface ToastContextType {
  toasts: ToastItem[]
  addToast: (message: string, type: ToastType, options?: ToastOptions) => string
  dismissToast: (id: string) => void
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: ToastPromiseMessages,
    options?: ToastOptions
  ) => Promise<T>
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Global reference for call-anywhere helper
let globalAddToast: ((message: string, type: ToastType, options?: ToastOptions) => string) | null = null
let globalDismissToast: ((id: string) => void) | null = null
let globalPromiseToast: (<T>(
  promise: Promise<T> | (() => Promise<T>),
  messages: ToastPromiseMessages,
  options?: ToastOptions
) => Promise<T>) | null = null

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType, options?: ToastOptions) => {
      const id = crypto.randomUUID()
      const duration = options?.duration ?? (type === "loading" ? 0 : 4000)
      const dismissable = options?.dismissable ?? true

      setToasts((prev) => [
        ...prev,
        { id, message, type, duration, dismissable },
      ])

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id)
        }, duration)
      }

      return id
    },
    [dismissToast]
  )

  const promise = useCallback(
    async <T,>(
      prom: Promise<T> | (() => Promise<T>),
      messages: ToastPromiseMessages,
      options?: ToastOptions
    ): Promise<T> => {
      const id = addToast(messages.loading, "loading", {
        ...options,
        dismissable: false,
      })

      try {
        const actualPromise = typeof prom === "function" ? prom() : prom
        const result = await actualPromise
        dismissToast(id)
        addToast(messages.success, "success", options)
        return result
      } catch (err) {
        dismissToast(id)
        addToast(messages.error, "error", options)
        throw err
      }
    },
    [addToast, dismissToast]
  )

  // Bind globals
  useEffect(() => {
    globalAddToast = addToast
    globalDismissToast = dismissToast
    globalPromiseToast = promise
    return () => {
      globalAddToast = null
      globalDismissToast = null
      globalPromiseToast = null
    }
  }, [addToast, dismissToast, promise])

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast, promise }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Call-anywhere toast object helper
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    if (globalAddToast) return globalAddToast(message, "success", options)
    console.warn("ToastProvider not found. Success message logged: ", message)
    return ""
  },
  error: (message: string, options?: ToastOptions) => {
    if (globalAddToast) return globalAddToast(message, "error", options)
    console.warn("ToastProvider not found. Error message logged: ", message)
    return ""
  },
  info: (message: string, options?: ToastOptions) => {
    if (globalAddToast) return globalAddToast(message, "info", options)
    console.warn("ToastProvider not found. Info message logged: ", message)
    return ""
  },
  loading: (message: string, options?: ToastOptions) => {
    if (globalAddToast) return globalAddToast(message, "loading", options)
    console.warn("ToastProvider not found. Loading message logged: ", message)
    return ""
  },
  dismiss: (id: string) => {
    if (globalDismissToast) globalDismissToast(id)
  },
  promise: <T,>(
    prom: Promise<T> | (() => Promise<T>),
    messages: ToastPromiseMessages,
    options?: ToastOptions
  ): Promise<T> => {
    if (globalPromiseToast) return globalPromiseToast(prom, messages, options)
    const actualPromise = typeof prom === "function" ? prom() : prom
    return actualPromise
  },
}

function ToastContainer({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  )
}

function ToastCard({ toast, dismiss }: { toast: ToastItem; dismiss: (id: string) => void }) {
  const { id, message, type, dismissable } = toast

  // Color Mapping matching DESIGN.md flat, premium theme
  const styles = {
    success: {
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />,
    },
    error: {
      bg: "bg-red-50 text-red-800 border-red-200/60",
      icon: <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />,
    },
    info: {
      bg: "bg-canvas-cream text-ink border-hairline-light",
      icon: <Info className="h-5 w-5 text-shade-50 shrink-0" />,
    },
    loading: {
      bg: "bg-canvas-light text-ink border-hairline-light",
      icon: <Loader2 className="h-5 w-5 text-emerald-800 shrink-0 animate-spin" />,
    },
  }[type]

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between gap-3 border rounded-xl p-4 shadow-lg animate-slide-in-right transition-all duration-200 ${styles.bg}`}
    >
      <div className="flex gap-3 items-start">
        {styles.icon}
        <span className="text-body-md font-medium leading-tight pt-0.5">{message}</span>
      </div>

      {dismissable && (
        <button
          onClick={() => dismiss(id)}
          className="p-1 rounded hover:bg-black/5 text-shade-40 hover:text-ink transition cursor-pointer shrink-0"
          aria-label="Dismiss toast"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
