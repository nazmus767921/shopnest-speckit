"use client"

import { ImageIcon, StarIcon, MoreVerticalIcon, LinkIcon, PencilIcon, FolderIcon, Trash2Icon } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

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

interface MediaCardProps {
  file: MediaFile
  isSelected?: boolean
  onToggleSelect?: (id: string, selected: boolean, shiftKey?: boolean) => void
  onDragStart?: (e: React.DragEvent, id: string) => void
  onToggleStar?: (file: MediaFile) => void
  onRename?: (file: MediaFile) => void
  onMove?: (fileIds: string[]) => void
  onDelete?: (fileIds: string[]) => void
  onCopyUrl?: (file: MediaFile) => void
}

export function MediaCard({
  file,
  isSelected,
  onToggleSelect,
  onDragStart,
  onToggleStar,
  onRename,
  onMove,
  onDelete,
  onCopyUrl,
}: MediaCardProps) {
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    const kb = bytes / 1024
    if (kb < 1024) return kb.toFixed(1) + " KB"
    const mb = kb / 1024
    return mb.toFixed(1) + " MB"
  }

  return (
    <div 
      className={cn(
        "group relative overflow-hidden flex flex-col cursor-pointer border border-foreground/10 bg-background transition-all duration-200 ease-out hover:border-foreground/30 hover:shadow-md rounded-lg select-none",
        isSelected && "ring-2 ring-primary border-transparent hover:border-transparent scale-[0.98]"
      )}
      onClick={(e) => onToggleSelect?.(file.id, !isSelected, e.shiftKey)}
      draggable
      onDragStart={(e) => onDragStart?.(e, file.id)}
    >
      {/* Checkbox Selection Overlay (Top-Left) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onToggleSelect?.(file.id, !isSelected)
        }}
        className={cn(
          "absolute top-2 left-2 z-10 p-1 rounded-full border bg-background/90 hover:bg-background shadow-sm transition-all duration-150 flex items-center justify-center h-6 w-6",
          isSelected 
            ? "border-primary bg-primary text-primary-foreground opacity-100 scale-100" 
            : "border-foreground/15 opacity-100 md:opacity-0 scale-100 md:scale-90 md:group-hover:opacity-100 md:group-hover:scale-100"
        )}
      >
        <div className={cn(
          "h-2 w-2 rounded-full",
          isSelected ? "bg-primary-foreground" : "bg-transparent"
        )} />
      </button>

      {/* Star Toggle Overlay (Top-Right) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onToggleStar?.(file)
        }}
        className={cn(
          "absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/90 hover:bg-background shadow-sm border border-foreground/5 transition-all duration-150",
          file.isStarred 
            ? "opacity-100 scale-100" 
            : "opacity-100 md:opacity-0 scale-100 md:scale-90 md:group-hover:opacity-100 md:group-hover:scale-100"
        )}
      >
        <StarIcon 
          className={cn(
            "h-3.5 w-3.5 transition-colors duration-150", 
            file.isStarred ? "text-amber-500 fill-amber-500" : "text-muted-foreground hover:text-foreground"
          )} 
        />
      </button>

      {/* Image Thumbnail Container */}
      <div className="aspect-square w-full bg-muted/20 flex items-center justify-center overflow-hidden border-b border-foreground/10">
         {file.type.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground/50 transition-transform duration-500 group-hover:scale-110" />
          )}
      </div>

      {/* Card Info & Dropdown Trigger */}
      <div className="p-3 flex items-start justify-between gap-2 relative">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate text-foreground leading-tight" title={file.name}>{file.name}</p>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">{formatSize(file.size)}</p>
        </div>

        {/* Action Menu (Visible on hover on desktop, persistent on mobile) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 border border-transparent hover:border-foreground/5 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-none"
            >
              <MoreVerticalIcon className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 border-foreground/10 shadow-lg">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopyUrl?.(file); }} className="gap-2 cursor-pointer text-xs">
              <LinkIcon className="h-3.5 w-3.5" /> Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename?.(file); }} className="gap-2 cursor-pointer text-xs">
              <PencilIcon className="h-3.5 w-3.5" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove?.([file.id]); }} className="gap-2 cursor-pointer text-xs">
              <FolderIcon className="h-3.5 w-3.5" /> Move
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStar?.(file); }} className="gap-2 cursor-pointer text-xs">
              <StarIcon className={cn("h-3.5 w-3.5", file.isStarred && "text-amber-500 fill-amber-500")} /> 
              {file.isStarred ? "Unstar" : "Star"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.([file.id]); }} className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2Icon className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
