"use client"

import React from "react"

export function InvoiceActions() {
  return (
    <div className="mt-8 flex justify-center gap-4 print:hidden">
      <button 
        onClick={() => window.history.back()} 
        className="px-4 py-2 border border-hairline rounded-md text-caption font-medium text-shade-60 hover:bg-canvas-light transition-colors"
      >
        Back to Dashboard
      </button>
      <button 
        onClick={() => window.print()}
        className="px-4 py-2 bg-primary text-white rounded-md text-caption font-medium hover:bg-primary-dark transition-colors"
      >
        Print Invoice
      </button>
    </div>
  )
}
