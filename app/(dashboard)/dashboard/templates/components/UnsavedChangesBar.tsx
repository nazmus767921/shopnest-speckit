"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Loader2Icon, SaveIcon, XIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface UnsavedChangesBarProps {
  hasUnsavedChanges: boolean
  isSaving: boolean
  onSave: () => void
  onDiscard: () => void
}

export function UnsavedChangesBar({ hasUnsavedChanges, isSaving, onSave, onDiscard }: UnsavedChangesBarProps) {
  if (!hasUnsavedChanges && !isSaving) {
    return null
  }

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
      "w-[90%] max-w-2xl bg-zinc-900 text-zinc-50 rounded-xl shadow-2xl border border-zinc-800",
      "flex items-center justify-between px-6 py-4 animate-in slide-in-from-bottom-10 fade-in duration-300"
    )}>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-medium text-sm">You have unsaved changes</span>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDiscard}
          disabled={isSaving}
          className="text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          <XIcon className="w-4 h-4 mr-2" />
          Discard
        </Button>
        <Button 
          size="sm" 
          onClick={onSave}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSaving ? (
            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <SaveIcon className="w-4 h-4 mr-2" />
          )}
          {isSaving ? "Saving..." : "Save All"}
        </Button>
      </div>
    </div>
  )
}
