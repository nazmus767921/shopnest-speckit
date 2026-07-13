"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { XIcon, Trash2Icon, FolderOutputIcon, StarIcon, CopyIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface MediaFile {
  id: string
  url: string
  key: string
  name: string
  size: number
  type: string
  folder: string
  isStarred: boolean
}

interface MediaActionOverlayProps {
  selectedFiles: MediaFile[]
  onClear: () => void
  onDelete: () => void
  onMove: () => void
  onStar: (isStarred: boolean) => void
  onCopyUrl: () => void
}

export function MediaActionOverlay({
  selectedFiles,
  onClear,
  onDelete,
  onMove,
  onStar,
  onCopyUrl
}: MediaActionOverlayProps) {
  const isVisible = selectedFiles.length > 0
  
  // If all selected files are already starred, the action should be "Unstar"
  const allStarred = selectedFiles.length > 0 && selectedFiles.every(f => f.isStarred)

  return (
    <div 
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out flex items-center shadow-2xl rounded-full border border-foreground/10 bg-background/95 backdrop-blur-md p-1.5",
        isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95 pointer-events-none"
      )}
    >
      <div className="flex items-center gap-1">
        <div className="flex items-center px-4 border-r border-foreground/10 h-8">
          <span className="text-sm font-semibold tracking-tight">
            {selectedFiles.length} <span className="text-muted-foreground font-medium">selected</span>
          </span>
        </div>
        
        {selectedFiles.length === 1 && (
          <Button variant="ghost" size="sm" onClick={onCopyUrl} className="rounded-full h-8 px-4 text-xs font-medium">
            <CopyIcon className="h-3.5 w-3.5 mr-2" />
            Copy Link
          </Button>
        )}
        
        <Button variant="ghost" size="sm" onClick={() => onStar(!allStarred)} className="rounded-full h-8 px-4 text-xs font-medium">
          <StarIcon className={cn("h-3.5 w-3.5 mr-2 transition-colors", allStarred ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} />
          {allStarred ? "Unstar" : "Star"}
        </Button>
        
        <Button variant="ghost" size="sm" onClick={onMove} className="rounded-full h-8 px-4 text-xs font-medium">
          <FolderOutputIcon className="h-3.5 w-3.5 mr-2" />
          Move
        </Button>
        
        <Button variant="ghost" size="sm" onClick={onDelete} className="rounded-full h-8 px-4 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2Icon className="h-3.5 w-3.5 mr-2" />
          Delete
        </Button>

        <div className="w-px h-5 bg-foreground/10 mx-1" />

        <Button variant="ghost" size="icon" onClick={onClear} className="rounded-full h-8 w-8 hover:bg-muted">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
