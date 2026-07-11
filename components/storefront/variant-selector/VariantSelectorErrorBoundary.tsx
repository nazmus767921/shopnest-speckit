"use client";

import { Component, type ReactNode } from "react";
import { AlertCircleIcon, RefreshCwIcon } from "@/lib/icons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class VariantSelectorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-lg border border-hairline-light bg-canvas-light p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircleIcon className="h-4 w-4 text-red-400" />
            <p className="text-body-md text-ink font-medium">Variant selection unavailable</p>
          </div>
          <p className="text-micro text-shade-50 mb-3">
            Something went wrong loading product variants. The base product is still available for purchase.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline-light px-3 py-1.5 text-caption text-ink hover:bg-canvas-cream transition-colors"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
