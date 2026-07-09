"use client"

import React from "react"
import { Button } from "@/components/ui/button"

export function InvoiceActions() {
  return (
    <div className="mt-8 flex justify-center gap-4 print:hidden">
      <Button 
        variant="outline"
        onClick={() => window.history.back()} 
      >
        Back to Dashboard
      </Button>
      <Button 
        onClick={() => window.print()}
      >
        Print Invoice
      </Button>
    </div>
  )
}
