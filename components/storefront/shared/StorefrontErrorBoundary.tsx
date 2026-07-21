"use client"

import React, { Component, ErrorInfo } from "react"
import { AlertTriangleIcon } from "@/lib/icons"

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class StorefrontErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Storefront Template Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-zinc-200 rounded-xl p-8 text-center shadow-sm">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 mb-2">
              Unable to load storefront
            </h1>
            <p className="text-sm text-zinc-500 mb-6">
              We encountered an unexpected error while rendering this page. Please try refreshing.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mt-8 p-4 bg-zinc-100 text-left rounded-lg overflow-x-auto text-xs font-mono text-zinc-800">
                {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
