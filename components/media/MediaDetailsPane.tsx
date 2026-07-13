"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { XIcon, Trash2Icon, FolderOutputIcon, Edit2Icon, CopyIcon, ImageIcon, HardDriveIcon } from "@/lib/icons"
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
  createdAt: Date
}

interface MediaDetailsPaneProps {
  selectedFiles: MediaFile[]
  onClose: () => void
  onRename: (file: MediaFile) => void
  onMove: (fileIds: string[]) => void
  onDelete: (fileIds: string[]) => void
}

export function MediaDetailsPane({
  selectedFiles,
  onClose,
  onRename,
  onMove,
  onDelete
}: MediaDetailsPaneProps) {
  const [copying, setCopying] = React.useState(false)

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    const kb = bytes / 1024
    if (kb < 1024) return kb.toFixed(1) + " KB"
    const mb = kb / 1024
    return mb.toFixed(1) + " MB"
  }

  const handleCopyLink = async (file: MediaFile) => {
    try {
      await navigator.clipboard.writeText(file.url)
      setCopying(true)
      setTimeout(() => setCopying(false), 2000)
    } catch (e) {
      console.error("Failed to copy link")
    }
  }

  const hasSelection = selectedFiles.length > 0
  const isSingle = selectedFiles.length === 1
  const activeFile = isSingle ? selectedFiles[0] : null
  
  // Calculate aggregate stats for multi-select
  const totalSize = React.useMemo(() => {
    return selectedFiles.reduce((acc, f) => acc + f.size, 0)
  }, [selectedFiles])

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-muted/10 border-l border-foreground/10 transition-all duration-200 overflow-hidden shrink-0 select-none",
        hasSelection ? "w-64 opacity-100" : "w-0 opacity-0 border-l-0"
      )}
    >
      {hasSelection && (
        <>
          <div className="flex items-center justify-between p-3 border-b border-foreground/10 bg-background/50">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Inspector</h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-md hover:bg-muted/80">
              <XIcon className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {isSingle && activeFile ? (
              // Single File Mode
              <>
                <div className="aspect-square w-full rounded-lg border border-foreground/10 bg-muted/20 flex items-center justify-center overflow-hidden relative group shadow-inner">
                  {activeFile.type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeFile.url} alt={activeFile.name} className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between group">
                      <p className="text-[13px] font-bold truncate pr-2 w-full" title={activeFile.name}>
                        {activeFile.name}
                      </p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 rounded-md hover:bg-muted/80" onClick={() => onRename(activeFile)}>
                        <Edit2Icon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-foreground/5 pt-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-medium">{formatSize(activeFile.size)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Kind</span>
                      <span className="font-medium uppercase">{activeFile.type.split('/')[1] || "File"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium capitalize">{activeFile.folder === "uncategorized" ? "Uncategorized" : activeFile.folder}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Starred</span>
                      <span className="font-medium">{activeFile.isStarred ? "Yes" : "No"}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-foreground/10 space-y-1.5">
                    <Button variant="outline" className="w-full justify-start rounded-md h-8 text-[13px] font-medium" onClick={() => handleCopyLink(activeFile)}>
                      <CopyIcon className="h-3.5 w-3.5 mr-2 opacity-80" />
                      {copying ? "Copied!" : "Copy Link"}
                    </Button>
                    <Button variant="outline" className="w-full justify-start rounded-md h-8 text-[13px] font-medium" onClick={() => onMove([activeFile.id])}>
                      <FolderOutputIcon className="h-3.5 w-3.5 mr-2 opacity-80" />
                      Move to...
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive border-transparent rounded-md h-8 text-[13px] font-medium" onClick={() => onDelete([activeFile.id])}>
                      <Trash2Icon className="h-3.5 w-3.5 mr-2 opacity-80" />
                      Delete File
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Multi Selection Mode
              <div className="flex flex-col items-center justify-center pt-8 text-center">
                <div className="w-16 h-16 rounded-xl border border-dashed border-foreground/15 bg-muted/10 flex items-center justify-center mb-4 relative">
                  <ImageIcon className="h-7 w-7 text-muted-foreground/50 absolute -translate-x-1.5 -translate-y-1 rotate-[-6deg]" />
                  <ImageIcon className="h-7 w-7 text-muted-foreground/80 bg-background rounded p-0.5 border shadow-sm relative z-10 rotate-[4deg]" />
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1">{selectedFiles.length} Items Selected</h4>
                <p className="text-xs text-muted-foreground mb-6">Aggregate selection summary</p>

                <div className="w-full space-y-2 border-t border-foreground/5 pt-4 text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Total Size</span>
                    <span className="font-semibold">{formatSize(totalSize)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Files Count</span>
                    <span className="font-medium">{selectedFiles.length} images</span>
                  </div>
                </div>

                <div className="w-full pt-6 space-y-2">
                  <Button variant="outline" className="w-full justify-start rounded-md h-8 text-[13px] font-medium" onClick={() => onMove(selectedFiles.map(f => f.id))}>
                    <FolderOutputIcon className="h-3.5 w-3.5 mr-2 opacity-80" />
                    Move Selection...
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive border-transparent rounded-md h-8 text-[13px] font-medium" onClick={() => onDelete(selectedFiles.map(f => f.id))}>
                    <Trash2Icon className="h-3.5 w-3.5 mr-2 opacity-80" />
                    Delete Selection
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

