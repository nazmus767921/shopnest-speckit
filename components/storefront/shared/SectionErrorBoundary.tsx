"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangleIcon } from "@/lib/icons"

interface Props {
  children: ReactNode
  sectionKey: string
}

interface State {
  hasError: boolean
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in section ${this.props.sectionKey}:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // In a real storefront, we'd probably render nothing, but for preview/admin
      // it's useful to show an error state. We'll render a minimal error box.
      return (
        <div className="w-full p-4 border border-red-200 bg-red-50 text-red-600 flex items-center justify-center gap-2">
          <AlertTriangleIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Error loading section: {this.props.sectionKey}</span>
        </div>
      )
    }

    return this.props.children
  }
}
