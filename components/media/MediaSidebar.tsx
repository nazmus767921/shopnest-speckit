"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { PlusIcon, FolderIcon, XIcon, ClockIcon, StarIcon, HardDriveIcon, FolderOpenIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface MediaFolder {
  id: string
  name: string
  slug: string
}

interface MediaSidebarProps {
  files: any[]
  folders: MediaFolder[]
  currentFolder: string
  onSelectFolder: (slug: string) => void
  onCreateFolder: (name: string, slug: string) => void
  onDeleteFolder: (slug: string) => void
  onMoveFiles?: (fileIds: string[], folderSlug: string) => void
}

export function MediaSidebar({
  files,
  folders,
  currentFolder,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  onMoveFiles
}: MediaSidebarProps) {
  const [isCreating, setIsCreating] = React.useState(false)
  const [newFolderName, setNewFolderName] = React.useState("")
  const [isPending, setIsPending] = React.useState(false)
  const [draggedOverSlug, setDraggedOverSlug] = React.useState<string | null>(null)
  
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCreating])

  const handleCreate = async () => {
    if (!newFolderName.trim()) {
      setIsCreating(false)
      return
    }
    
    setIsPending(true)
    const slug = newFolderName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    await onCreateFolder(newFolderName.trim(), slug)
    setIsPending(false)
    setIsCreating(false)
    setNewFolderName("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate()
    } else if (e.key === "Escape") {
      setIsCreating(false)
      setNewFolderName("")
    }
  }

  // Drag and Drop helpers for moving files to folders
  const handleDragOver = (e: React.DragEvent, slug: string) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes("media/file-ids")) {
      setDraggedOverSlug(slug)
      e.dataTransfer.dropEffect = "move"
    }
  }

  const handleDragLeave = () => {
    setDraggedOverSlug(null)
  }

  const handleDrop = (e: React.DragEvent, slug: string) => {
    e.preventDefault()
    setDraggedOverSlug(null)
    const data = e.dataTransfer.getData("media/file-ids")
    if (data && onMoveFiles) {
      try {
        const fileIds = JSON.parse(data) as string[]
        if (fileIds && fileIds.length > 0) {
          onMoveFiles(fileIds, slug)
        }
      } catch (err) {
        console.error("Failed to parse dragged file IDs on drop:", err)
      }
    }
  }

  // Compute file count for directories
  const getCount = (slug: string) => {
    if (slug === "all") return files.length
    if (slug === "recent") {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return files.filter(f => new Date(f.createdAt) >= sevenDaysAgo).length
    }
    if (slug === "starred") return files.filter(f => f.isStarred).length
    if (slug === "uncategorized") return files.filter(f => f.folder === "uncategorized" || !f.folder).length
    return files.filter(f => f.folder === slug).length
  }

  const navItemClass = (isActive: boolean, isDraggedOver: boolean) => cn(
    "w-full flex items-center justify-between font-semibold rounded-lg transition-all duration-150 h-9 text-sm px-3 border border-transparent select-none",
    isActive 
      ? "bg-primary/[0.08] text-primary shadow-none hover:bg-primary/[0.08]" 
      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
    isDraggedOver && "border-dashed border-primary ring-2 ring-primary/45 bg-primary/5 text-primary scale-[0.98]"
  )

  return (
    <div className="w-full md:w-[220px] border-r border-foreground/5 bg-background select-none flex flex-col shrink-0 h-full">
      <div className="p-4 flex-1 flex flex-col gap-6 overflow-y-auto">
        
        {/* Library Section */}
        <div>
          <h2 className="font-bold text-[11px] tracking-wider uppercase text-muted-foreground/60 mb-2 px-3">Library</h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className={navItemClass(currentFolder === "all", false)}
              onClick={() => onSelectFolder("all")}
            >
              <span className="flex items-center gap-2">
                <HardDriveIcon className="h-4 w-4 opacity-80" />
                All Media
              </span>
              <span className="text-[10px] font-bold text-muted-foreground/80 bg-muted/40 px-2 py-0.5 rounded-full shrink-0">
                {getCount("all")}
              </span>
            </Button>
            <Button
              variant="ghost"
              className={navItemClass(currentFolder === "recent", false)}
              onClick={() => onSelectFolder("recent")}
            >
              <span className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 opacity-80" />
                Recent
              </span>
              <span className="text-[10px] font-bold text-muted-foreground/80 bg-muted/40 px-2 py-0.5 rounded-full shrink-0">
                {getCount("recent")}
              </span>
            </Button>
            <Button
              variant="ghost"
              className={navItemClass(currentFolder === "starred", false)}
              onClick={() => onSelectFolder("starred")}
            >
              <span className="flex items-center gap-2">
                <StarIcon className="h-4 w-4 opacity-80" />
                Starred
              </span>
              <span className="text-[10px] font-bold text-muted-foreground/80 bg-muted/40 px-2 py-0.5 rounded-full shrink-0">
                {getCount("starred")}
              </span>
            </Button>
          </div>
        </div>

        {/* Folders Section */}
        <div>
          <div className="flex items-center justify-between mb-2 px-3">
            <h2 className="font-bold text-[11px] tracking-wider uppercase text-muted-foreground/60">Folders</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsCreating(true)} 
              className="h-5 w-5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="space-y-1">
            {/* Uncategorized Fallback Folder */}
            <div
              onDragOver={(e) => handleDragOver(e, "uncategorized")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "uncategorized")}
            >
              <Button
                variant="ghost"
                className={navItemClass(currentFolder === "uncategorized", draggedOverSlug === "uncategorized")}
                onClick={() => onSelectFolder("uncategorized")}
              >
                <span className="flex items-center gap-2">
                  <FolderOpenIcon className="h-4 w-4 opacity-80" />
                  Uncategorized
                </span>
                <span className="text-[10px] font-bold text-muted-foreground/80 bg-muted/40 px-2 py-0.5 rounded-full shrink-0">
                  {getCount("uncategorized")}
                </span>
              </Button>
            </div>
            
            {/* Custom Folders */}
            {folders.map(folder => {
              const isDraggedOver = draggedOverSlug === folder.slug
              return (
                <div 
                  key={folder.id} 
                  className="group relative"
                  onDragOver={(e) => handleDragOver(e, folder.slug)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder.slug)}
                >
                  <Button
                    variant="ghost"
                    className={cn(navItemClass(currentFolder === folder.slug, isDraggedOver), "pr-8")}
                    onClick={() => onSelectFolder(folder.slug)}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <FolderIcon className="h-4 w-4 opacity-80 shrink-0" />
                      <span className="truncate text-left">{folder.name}</span>
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground/80 bg-muted/40 px-2 py-0.5 rounded-full shrink-0 absolute right-2 group-hover:opacity-0 transition-opacity">
                      {getCount(folder.slug)}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 top-1 h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteFolder(folder.slug)
                    }}
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })}

            {isCreating && (
              <div className="px-3 py-1">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleCreate}
                  disabled={isPending}
                  className="h-8.5 w-full text-sm bg-background border border-foreground/15 rounded-md px-2 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  )
}
