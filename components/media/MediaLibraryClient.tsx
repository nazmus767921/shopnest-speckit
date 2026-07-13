"use client"

import * as React from "react"
import { MediaSidebar } from "./MediaSidebar"
import { MediaCard } from "./MediaCard"
import { MediaDetailsPane } from "./MediaDetailsPane"
import { MediaActionOverlay } from "./MediaActionOverlay"
import { MediaDataTable } from "./MediaDataTable"
import {
  deleteFolderAction,
  createFolderAction,
  deleteMediaFilesAction,
  renameMediaFileAction,
  moveMediaFilesAction,
  createMediaFileAction,
  toggleStarMediaAction
} from "@/app/actions/media"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  LayoutGridIcon,
  ListIcon,
  UploadCloudIcon,
  SearchIcon,
  XIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Loader2Icon,
  MenuIcon,
  FilterIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  GridIcon,
  ImageIcon,
  HardDriveIcon,
  FolderIcon,
  PencilIcon,
  Trash2Icon,
  StarIcon
} from "@/lib/icons"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { calculateShiftClickRange, validateFileForStaging } from "@/lib/media-helpers"

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

interface MediaFolder {
  id: string
  name: string
  slug: string
}

interface MediaLibraryClientProps {
  files: MediaFile[]
  folders: MediaFolder[]
  limitMb: number // Injected subscription size limit
}

interface StagedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: "staged" | "uploading" | "success" | "error"
  progress: number
  error?: string
}

interface RejectedFile {
  id: string
  name: string
  size: number
  type: string
  reason: string
}

export function MediaLibraryClient({ files, folders, limitMb }: MediaLibraryClientProps) {
  const [currentFolder, setCurrentFolder] = React.useState("all") // 'all', 'recent', 'starred', or folder slug
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [lastSelectedId, setLastSelectedId] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("library")

  // Sort and Filter States
  const [sortBy, setSortBy] = React.useState<"name" | "size" | "date">("date")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [filterType, setFilterType] = React.useState<"all" | "image" | "svg" | "gif">("all")
  const [showFilters, setShowFilters] = React.useState(false)

  // Responsive States
  const [isMobile, setIsMobile] = React.useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = React.useState(false)

  // Drag over page state
  const [isDragOverPage, setIsDragOverPage] = React.useState(false)

  // Custom Dialog States (Replacing Browser native prompt/confirm)
  const [renameFile, setRenameFile] = React.useState<MediaFile | null>(null)
  const [renameInput, setRenameInput] = React.useState("")
  const [moveFileIds, setMoveFileIds] = React.useState<string[] | null>(null)
  const [deleteFileIds, setDeleteFileIds] = React.useState<string[] | null>(null)
  const [deleteFolderSlug, setDeleteFolderSlug] = React.useState<string | null>(null)

  // Upload Staging State
  const [stagedFiles, setStagedFiles] = React.useState<StagedFile[]>([])
  const [rejectedFiles, setRejectedFiles] = React.useState<RejectedFile[]>([])
  const [isBulkUploading, setIsBulkUploading] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const dragCounter = React.useRef(0)
  const limitBytes = limitMb * 1024 * 1024

  // Check viewport width for mobile layout support
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Close details sheet if selection becomes empty
  React.useEffect(() => {
    if (selectedIds.size === 0) {
      setIsDetailsSheetOpen(false)
    }
  }, [selectedIds])

  // Filter, Search and Sort visible files
  const visibleFiles = React.useMemo(() => {
    let filtered = files

    // Folder Filter
    if (currentFolder === "recent") {
      // sort will be handled below but default limit applies for recent
    } else if (currentFolder === "starred") {
      filtered = files.filter(f => f.isStarred)
    } else if (currentFolder !== "all") {
      filtered = files.filter(f => f.folder === currentFolder)
    }

    // Type Filter
    if (filterType !== "all") {
      if (filterType === "image") {
        filtered = filtered.filter(f => f.type.startsWith("image/") && !f.type.includes("svg") && !f.type.includes("gif"))
      } else if (filterType === "svg") {
        filtered = filtered.filter(f => f.type.includes("svg") || f.name.endsWith(".svg"))
      } else if (filterType === "gif") {
        filtered = filtered.filter(f => f.type.includes("gif") || f.name.endsWith(".gif"))
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(f => f.name.toLowerCase().includes(q))
    }

    // Sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === "size") {
        comparison = a.size - b.size
      } else if (sortBy === "date") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    if (currentFolder === "recent") {
      filtered = filtered.slice(0, 50)
    }

    return filtered
  }, [files, currentFolder, searchQuery, sortBy, sortOrder, filterType])

  const selectedFiles = React.useMemo(() => {
    return files.filter(f => selectedIds.has(f.id))
  }, [files, selectedIds])

  // Selection Logic with Shift-Click range support
  const handleToggleSelect = (id: string, selected: boolean, shiftKey?: boolean) => {
    if (shiftKey) {
      const visibleFileIds = visibleFiles.map(f => f.id)
      const next = calculateShiftClickRange(visibleFileIds, lastSelectedId, id, selectedIds)
      setSelectedIds(next)
      setLastSelectedId(id)
    } else {
      const next = new Set(selectedIds)
      if (selected) {
        next.add(id)
        setLastSelectedId(id)
      } else {
        next.delete(id)
        if (lastSelectedId === id) setLastSelectedId(null)
      }
      setSelectedIds(next)
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (!selected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleFiles.map(f => f.id)))
    }
  }

  // Folder Actions
  const handleCreateFolder = async (name: string, slug: string) => {
    const res = await createFolderAction(name, slug)
    if (!res.success) toast.error(res.error)
    else toast.success("Folder created")
  }

  const handleDeleteFolder = (slug: string) => {
    setDeleteFolderSlug(slug)
  }

  const executeDeleteFolder = async () => {
    if (!deleteFolderSlug) return
    const res = await deleteFolderAction(deleteFolderSlug)
    setDeleteFolderSlug(null)
    if (!res.success) toast.error(res.error)
    else {
      toast.success("Folder deleted")
      if (currentFolder === deleteFolderSlug) setCurrentFolder("all")
    }
  }

  // File Actions
  const handleDeleteFiles = (fileIds: string[]) => {
    setDeleteFileIds(fileIds)
  }

  const executeDeleteFiles = async () => {
    if (!deleteFileIds || deleteFileIds.length === 0) return
    const res = await deleteMediaFilesAction(deleteFileIds)
    setDeleteFileIds(null)
    if (!res.success) toast.error(res.error)
    else {
      toast.success(`${res.count || deleteFileIds.length} file(s) deleted`)
      const next = new Set(selectedIds)
      deleteFileIds.forEach(id => next.delete(id))
      setSelectedIds(next)
    }
  }

  const handleRename = (file: MediaFile) => {
    setRenameFile(file)
    setRenameInput(file.name)
  }

  const executeRename = async () => {
    if (!renameFile || !renameInput.trim() || renameInput.trim() === renameFile.name) {
      setRenameFile(null)
      return
    }
    const res = await renameMediaFileAction(renameFile.id, renameInput.trim())
    setRenameFile(null)
    if (!res.success) toast.error(res.error)
    else toast.success("File renamed")
  }

  const handleMove = (fileIds: string[], folderSlug?: string) => {
    if (folderSlug) {
      // Direct drag and drop folder placement
      executeMove(fileIds, folderSlug)
    } else {
      // Toggle select dialog modal
      setMoveFileIds(fileIds)
    }
  }

  const executeMove = async (fileIds: string[], folderSlug: string) => {
    const res = await moveMediaFilesAction(fileIds, folderSlug)
    setMoveFileIds(null)
    if (!res.success) toast.error(res.error)
    else {
      toast.success(`Moved file(s) to ${folderSlug === "uncategorized" ? "Uncategorized" : folderSlug}`)
      setSelectedIds(new Set())
    }
  }

  const handleToggleStar = async (fileIds: string[], isStarred: boolean) => {
    const res = await toggleStarMediaAction(fileIds, isStarred)
    if (!res.success) toast.error(res.error)
    else toast.success(isStarred ? "Starred" : "Unstarred")
  }

  const handleCopyUrl = async (file: MediaFile) => {
    try {
      await navigator.clipboard.writeText(file.url)
      toast.success("Link copied to clipboard")
    } catch (e) {
      toast.error("Failed to copy link")
    }
  }

  // Upload Queue Staging and Validation
  const stageFilesForUpload = (filesToStage: File[]) => {
    const newStaged: StagedFile[] = []
    const newRejected: RejectedFile[] = []

    filesToStage.forEach(file => {
      const validation = validateFileForStaging(
        { name: file.name, size: file.size, type: file.type },
        limitBytes
      )

      if (validation.valid) {
        newStaged.push({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: "staged",
          progress: 0
        })
      } else {
        newRejected.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          reason: validation.error || "Invalid file"
        })
      }
    })

    if (newStaged.length > 0) {
      setStagedFiles(prev => [...prev, ...newStaged])
      setActiveTab("upload")
    }
    if (newRejected.length > 0) {
      setRejectedFiles(prev => [...prev, ...newRejected])
      setActiveTab("upload")
      toast.error(`Rejected ${newRejected.length} file(s) due to validation errors.`)
    }
  }

  const removeStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id))
  }

  const clearRejectedList = () => {
    setRejectedFiles([])
  }

  // Bulk Upload Processing
  const handleBulkUpload = async () => {
    const pending = stagedFiles.filter(f => f.status === "staged" || f.status === "error")
    if (pending.length === 0) return

    setIsBulkUploading(true)
    const uploadFolder = (currentFolder === "all" || currentFolder === "recent" || currentFolder === "starred")
      ? "uncategorized"
      : currentFolder

    for (const staged of pending) {
      setStagedFiles(prev => prev.map(f => f.id === staged.id ? { ...f, status: "uploading", progress: 10 } : f))

      const interval = setInterval(() => {
        setStagedFiles(prev => prev.map(f => {
          if (f.id === staged.id && f.status === "uploading" && f.progress < 85) {
            return { ...f, progress: f.progress + 15 }
          }
          return f
        }))
      }, 200)

      try {
        const fileExt = staged.file.name.split(".").pop()
        const key = `${crypto.randomUUID()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("media")
          .upload(key, staged.file)

        if (uploadError) throw new Error(uploadError.message)

        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(key)

        const res = await createMediaFileAction({
          url: publicUrl,
          key: uploadData.path,
          name: staged.name,
          size: staged.size,
          type: staged.type,
          folder: uploadFolder
        })

        clearInterval(interval)

        if (!res.success) throw new Error(res.error || "Metadata save error")

        setStagedFiles(prev => prev.map(f => f.id === staged.id ? { ...f, status: "success", progress: 100 } : f))
      } catch (error: any) {
        clearInterval(interval)
        setStagedFiles(prev => prev.map(f => f.id === staged.id ? { ...f, status: "error", progress: 100, error: error.message } : f))
        toast.error(`Failed uploading ${staged.name}: ${error.message}`)
      }
    }

    setIsBulkUploading(false)
    toast.success("Bulk upload operation finished")
  }

  // Global Drag & Drop for page staging
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current += 1
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasFiles = Array.from(e.dataTransfer.items).some(item => item.kind === "file")
      if (hasFiles) {
        setIsDragOverPage(true)
      }
    }
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      setIsDragOverPage(false)
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOverPage(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      stageFilesForUpload(Array.from(e.dataTransfer.files))
    }
  }

  // Dragging items from the list/grid
  const handleDragStartItem = (e: React.DragEvent, fileId: string) => {
    let dragIds = [fileId]
    if (selectedIds.has(fileId)) {
      dragIds = Array.from(selectedIds)
    } else {
      setSelectedIds(new Set([fileId]))
      dragIds = [fileId]
    }
    e.dataTransfer.setData("media/file-ids", JSON.stringify(dragIds))
    e.dataTransfer.effectAllowed = "move"
  }

  // Overall statistics for the queue
  const queueStats = React.useMemo(() => {
    const total = stagedFiles.length
    const success = stagedFiles.filter(f => f.status === "success").length
    const errors = stagedFiles.filter(f => f.status === "error").length
    const uploading = stagedFiles.filter(f => f.status === "uploading").length
    const totalBytes = stagedFiles.reduce((acc, f) => acc + f.size, 0)
    const progress = total > 0 ? Math.round((stagedFiles.reduce((acc, f) => acc + f.progress, 0) / (total * 100)) * 100) : 0

    return { total, success, errors, uploading, totalBytes, progress }
  }, [stagedFiles])

  return (
    <div
      className="flex h-full bg-background overflow-hidden relative select-none w-full"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => { if (e.target.files) stageFilesForUpload(Array.from(e.target.files)) }}
        className="hidden"
        accept="image/*"
        multiple
      />

      {/* Global Drag Overlay */}
      {isDragOverPage && (
        <div className="absolute inset-0 z-50 bg-background/85 backdrop-blur-sm border-4 border-dashed border-primary flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <UploadCloudIcon className="h-16 w-16 text-primary mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold tracking-tight text-primary">Drop files here to stage</h2>
          <p className="text-muted-foreground text-sm mt-1.5 font-medium">
            Files will be staged in the Upload Queue
          </p>
        </div>
      )}

      {/* Desktop Sidebar (Left Pane) */}
      {!isMobile && (
        <MediaSidebar
          files={files}
          folders={folders}
          currentFolder={currentFolder}
          onSelectFolder={(slug) => {
            setCurrentFolder(slug)
            setSelectedIds(new Set())
            setActiveTab("library")
          }}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveFiles={handleMove}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      {isMobile && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[260px] max-w-[80vw] h-full border-r bg-muted/30">
            <MediaSidebar
              files={files}
              folders={folders}
              currentFolder={currentFolder}
              onSelectFolder={(slug) => {
                setCurrentFolder(slug)
                setSelectedIds(new Set())
                setActiveTab("library")
                setIsSidebarOpen(false)
              }}
              onCreateFolder={handleCreateFolder}
              onDeleteFolder={handleDeleteFolder}
              onMoveFiles={handleMove}
            />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-background relative border-r border-foreground/5 h-full overflow-hidden w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full overflow-hidden w-full">

          {/* Top Page Header (Styled like Products Page Header) */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4 px-6 border-b border-border shrink-0 bg-background">
            <div>
              <h1 className="text-2xl md:text-3xl tracking-tight text-foreground font-bold leading-none">
                Media Library
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground/80 font-normal mt-1.5 md:mt-2">
                Manage your store media files, images, vector assets, and staging queues
              </p>
            </div>

            {/* Buttons Row (Centered Side-by-Side on Mobile) */}
            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
              {isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSidebarOpen(true)}
                  className="h-9 px-3 rounded-xl border-border bg-background hover:bg-muted text-xs font-semibold flex items-center gap-2"
                >
                  <MenuIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Folders & Views</span>
                </Button>
              )}

              {/* View Mode Toggle Group (Desktop Only) */}
              {!isMobile && activeTab === "library" && (
                <div className="flex border border-border bg-muted/30 p-1 rounded-xl items-center select-none gap-0.5">
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded-lg cursor-pointer transition-all",
                      viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="List View"
                  >
                    <ListIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 rounded-lg cursor-pointer transition-all",
                      viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Grid View"
                  >
                    <GridIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Primary Action Button (Fills Remaining Space on Mobile) */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "h-9 text-xs font-bold px-4 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 flex items-center justify-center gap-2",
                  isMobile ? "flex-1" : "w-auto"
                )}
              >
                <UploadCloudIcon className="h-4 w-4" />
                <span>Upload Media</span>
              </Button>
            </div>
          </div>

          {/* Sub-Header Toolbar (Responsive Multi-Row Layout) */}
          <div className="px-4 py-2.5 md:px-6 md:py-0 md:h-12 border-b border-foreground/10 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 shrink-0 bg-background/95 backdrop-blur z-10 w-full">
            <div className="flex items-center gap-4">
              <TabsList className="bg-transparent border-none rounded-none h-10 md:h-12 p-0 flex gap-5 md:gap-6 shrink-0 shadow-none">
                <TabsTrigger
                  value="library"
                  className="bg-transparent border-b-2 border-transparent rounded-none h-10 md:h-12 px-0.5 text-xs md:text-sm font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none transition-all duration-200 flex items-center"
                >
                  <HardDriveIcon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                  Library
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="bg-transparent border-b-2 border-transparent rounded-none h-10 md:h-12 px-0.5 text-xs md:text-sm font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none transition-all duration-200 relative flex items-center"
                >
                  <UploadCloudIcon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                  Upload Queue
                  {stagedFiles.filter(f => f.status === "staged").length > 0 && (
                    <span className="ml-2.5 px-2 py-0.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground select-none shrink-0 min-w-5 h-5 flex items-center justify-center animate-pulse">
                      {stagedFiles.filter(f => f.status === "staged").length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {activeTab === "library" && !isMobile && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                    {currentFolder === "all" ? "All Media" : currentFolder === "general" ? "uncategorized" : currentFolder}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">({visibleFiles.length} items)</span>
                </div>
              )}
            </div>

            {/* Actions & Filters (Only visible in Library Tab) */}
            {activeTab === "library" && (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex-1 md:w-40">
                  <InputGroup className="h-8 md:h-7 bg-muted/20 border-foreground/15 rounded-md">
                    <InputGroupAddon align="inline-start" className="pl-2.5">
                      <SearchIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </InputGroupAddon>
                    <InputGroupInput
                      type="search"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-xs"
                    />
                  </InputGroup>
                </div>

                {/* Collapsible Filter Bar Toggle */}
                <Button
                  variant={showFilters ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8 md:h-7 md:w-7 rounded-md shrink-0 border border-foreground/5 bg-muted/10 md:bg-transparent"
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filters & Sorting"
                >
                  <FilterIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Secondary Collapsible Filters Row (Slid-down on Toggle) */}
          {showFilters && activeTab === "library" && (
            <div className="px-6 py-2 border-b border-foreground/10 bg-muted/10 flex flex-wrap items-center gap-4 shrink-0 animate-in slide-in-from-top duration-150">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Type:</span>
                <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
                  <SelectTrigger size="sm" className="h-7 text-xs bg-background w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="image">Standard Images</SelectItem>
                    <SelectItem value="svg">Vector SVGs</SelectItem>
                    <SelectItem value="gif">Animated GIFs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sort:</span>
                <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                  <SelectTrigger size="sm" className="h-7 text-xs bg-background w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date Added</SelectItem>
                    <SelectItem value="name">File Name</SelectItem>
                    <SelectItem value="size">File Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-md bg-background"
                onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                title={sortOrder === "asc" ? "Sort Ascending" : "Sort Descending"}
              >
                {sortOrder === "asc" ? (
                  <ArrowUpIcon className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownIcon className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )}

          {/* Library Tab Content */}
          <TabsContent value="library" className="flex-1 overflow-hidden m-0 p-0 focus-visible:outline-none h-full w-full">
            <ScrollArea className="h-full w-full">
              <div
                className="p-4 min-h-[300px] w-full"
                onClick={() => setSelectedIds(new Set())}
              >
                {visibleFiles.length === 0 ? (
                  <div className="h-[calc(100vh-16rem)] flex flex-col items-center justify-center text-muted-foreground text-center p-6">
                    <UploadCloudIcon className="h-12 w-12 text-muted-foreground/30 mb-4 animate-pulse" />
                    <h3 className="text-lg font-bold text-foreground">No media files found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2">
                      Drag files directly here or click the 'Upload Media' button to start uploading.
                    </p>
                  </div>
                ) : viewMode === "grid" || isMobile ? (
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {visibleFiles.map(file => (
                      <MediaCard
                        key={file.id}
                        file={file}
                        isSelected={selectedIds.has(file.id)}
                        onToggleSelect={handleToggleSelect}
                        onDragStart={handleDragStartItem}
                        onToggleStar={(f) => handleToggleStar([f.id], !f.isStarred)}
                        onRename={handleRename}
                        onMove={(ids) => handleMove(ids)}
                        onDelete={(ids) => handleDeleteFiles(ids)}
                        onCopyUrl={handleCopyUrl}
                      />
                    ))}
                  </div>
                ) : (
                  <div onClick={(e) => e.stopPropagation()} className="w-full">
                    <MediaDataTable
                      data={visibleFiles}
                      selectedIds={selectedIds}
                      onToggleSelect={handleToggleSelect}
                      onSelectAll={handleSelectAll}
                      onRename={handleRename}
                      onMove={(f) => handleMove([f.id])}
                      onDelete={(f) => handleDeleteFiles([f.id])}
                      onToggleStar={(f) => handleToggleStar([f.id], !f.isStarred)}
                      onCopyUrl={handleCopyUrl}
                      onDragStart={handleDragStartItem}
                    />
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Upload Queue Tab Content */}
          <TabsContent value="upload" className="flex-1 overflow-hidden m-0 p-0 focus-visible:outline-none flex flex-col h-full w-full">
            <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-y-auto md:overflow-hidden h-full w-full">
              {/* Left Side: Staged Files Grid */}
              <div className="flex-1 flex flex-col border border-foreground/10 rounded-xl bg-muted/5 overflow-hidden h-[580px] md:h-auto shrink-0 md:shrink w-full">
                <div className="p-3 border-b border-foreground/10 bg-background/50 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Staging Area</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted/80">{stagedFiles.length} files staged</span>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                  {stagedFiles.length === 0 ? (
                    <div className="p-3 h-[calc(100vh-16rem)] flex items-center justify-center w-full">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-full max-h-[400px] border border-dashed border-foreground/15 hover:border-foreground/35 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-background/50 p-6"
                      >
                        <UploadCloudIcon className="h-12 w-12 text-muted-foreground/30 mb-4 animate-pulse" />
                        <h3 className="text-lg font-bold text-foreground">Select or Drag files to stage</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-2">PNG, JPEG, WebP, SVG, GIF up to {limitMb}MB each.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-3">
                      {stagedFiles.map((staged) => (
                        <div
                          key={staged.id}
                          className="group border border-foreground/10 rounded-lg overflow-hidden bg-background relative aspect-square flex flex-col select-none shadow-sm hover:border-foreground/20 hover:shadow transition-all"
                        >
                          {/* Close/Remove action (Persistent on mobile, hover on desktop) */}
                          {staged.status !== "uploading" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeStagedFile(staged.id)}
                              className="absolute top-1.5 right-1.5 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive text-muted-foreground p-1 rounded bg-background border border-foreground/5 transition-opacity h-6 w-6 flex items-center justify-center shadow-sm"
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Thumbnail preview */}
                          <div className="flex-1 bg-muted/20 relative flex items-center justify-center overflow-hidden border-b border-foreground/5 h-2/3">
                            {staged.type.startsWith("image/") ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={URL.createObjectURL(staged.file)} alt={staged.name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                            )}

                            {/* Uploading Status Overlay */}
                            {staged.status === "uploading" && (
                              <div className="absolute inset-0 bg-background/85 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 animate-in fade-in duration-150">
                                <Loader2Icon className="h-5 w-5 animate-spin text-primary mb-1" />
                                <span className="text-[9px] font-mono font-bold text-primary">{staged.progress}%</span>
                              </div>
                            )}

                            {/* Success Overlay */}
                            {staged.status === "success" && (
                              <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[0.5px] flex items-center justify-center animate-in zoom-in-95 duration-200">
                                <CheckCircle2Icon className="h-6 w-6 text-emerald-600 bg-background rounded-full border-2 border-emerald-600 shadow-sm" />
                              </div>
                            )}

                            {/* Error Overlay */}
                            {staged.status === "error" && (
                              <div className="absolute inset-0 bg-destructive/15 backdrop-blur-[0.5px] flex flex-col items-center justify-center p-1.5 text-center animate-in fade-in duration-150">
                                <AlertCircleIcon className="h-5 w-5 text-destructive mb-1" />
                                <span className="text-[8px] text-destructive font-bold truncate w-full px-1" title={staged.error}>Failed</span>
                              </div>
                            )}
                          </div>

                          {/* Info panel at bottom */}
                          <div className="p-2.5 bg-muted/10 mt-auto text-left h-1/3 flex flex-col justify-center">
                            <p className="text-xs font-semibold truncate text-foreground leading-tight" title={staged.name}>{staged.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-1 font-medium">{(staged.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Right Side: Rejection List and Upload controls */}
              <div className="w-full md:w-72 flex flex-col gap-4 shrink-0 md:h-full overflow-hidden">
                {/* Controls Card (Compact layout on mobile, sticky bottom pinned) */}
                <div className="border border-foreground/10 rounded-xl p-3 md:p-4 bg-background/95 md:bg-muted/5 backdrop-blur flex flex-col gap-2 md:gap-3 shrink-0 sticky bottom-0 md:relative z-20 shadow-lg md:shadow-none">
                  <h4 className="text-xs font-bold text-foreground hidden md:block">Upload Operations</h4>

                  {/* Compact Horizontal Meta Summary for Mobile */}
                  <div className="flex md:hidden items-center justify-between text-xs text-muted-foreground bg-background/50 p-2.5 rounded-lg border border-foreground/5">
                    <span className="font-semibold text-foreground">Staged: {queueStats.total}</span>
                    <span className="font-mono">{(queueStats.totalBytes / (1024 * 1024)).toFixed(2)} MB</span>
                    <span className="flex items-center gap-1 font-semibold truncate max-w-[120px]">
                      <FolderIcon className="h-3 w-3 text-muted-foreground/60" />
                      {currentFolder === "all" ? "uncategorized" : currentFolder}
                    </span>
                  </div>

                  {/* Standard Operations Details for Desktop */}
                  <div className="hidden md:flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Files</span>
                      <span className="font-semibold">{queueStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Queued Bytes</span>
                      <span className="font-mono">{(queueStats.totalBytes / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Destination</span>
                      <span className="flex items-center gap-1 font-semibold capitalize truncate max-w-[120px]">
                        <FolderIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
                        {currentFolder === "all" ? "uncategorized" : currentFolder}
                      </span>
                    </div>
                  </div>

                  {queueStats.uploading > 0 && (
                    <div className="space-y-1 mt-2">
                      <div className="flex justify-between text-[10px] font-semibold">
                        <span>Uploading Queue...</span>
                        <span>{queueStats.progress}%</span>
                      </div>
                      <Progress value={queueStats.progress} className="h-2" />
                    </div>
                  )}

                  {/* Staged Buttons Row (Side-by-Side on Mobile) */}
                  <div className="pt-1 flex gap-2 md:flex-col md:gap-1.5">
                    <Button
                      onClick={handleBulkUpload}
                      disabled={isBulkUploading || stagedFiles.filter(f => f.status === "staged" || f.status === "error").length === 0}
                      className="flex-1 text-xs h-8.5 font-bold"
                    >
                      {isBulkUploading ? (
                        <>
                          <Loader2Icon className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload All"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setStagedFiles([])}
                      disabled={isBulkUploading || stagedFiles.length === 0}
                      className="flex-1 text-xs h-8.5 text-muted-foreground hover:text-foreground border-border/80"
                    >
                      Clear Queue
                    </Button>
                  </div>
                </div>

                {/* Rejection List Card (Spans full available vertical space) */}
                {rejectedFiles.length > 0 && (
                  <div className="border border-red-500/10 rounded-xl bg-red-500/[0.02] flex-1 flex flex-col overflow-hidden w-full min-h-0">
                    <div className="p-3 border-b border-red-500/10 bg-red-500/[0.03] flex items-center justify-between shrink-0">
                      <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                        <AlertCircleIcon className="h-3.5 w-3.5 font-bold" /> Rejections ({rejectedFiles.length})
                      </span>
                      <Button variant="ghost" onClick={clearRejectedList} className="h-5 text-[10px] px-1.5 text-red-600 hover:bg-red-500/10 rounded-md">
                        Clear
                      </Button>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                      <div className="p-3 space-y-2 text-left w-full">
                        {rejectedFiles.map(rej => (
                          <div key={rej.id} className="p-2 border border-red-500/10 bg-background rounded-lg text-xs break-words w-full overflow-hidden">
                            <p className="font-semibold text-foreground break-all" title={rej.name}>{rej.name}</p>
                            <p className="text-[10px] text-red-500 mt-1 font-medium leading-relaxed break-words">{rej.reason}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Details Inspect Panel */}
      {!isMobile && (
        <MediaDetailsPane
          selectedFiles={selectedFiles}
          onClose={() => setSelectedIds(new Set())}
          onRename={handleRename}
          onMove={(ids) => handleMove(ids)}
          onDelete={(ids) => handleDeleteFiles(ids)}
        />
      )}

      {/* Desktop Floating Action Bar */}
      {!isMobile && (
        <MediaActionOverlay
          selectedFiles={selectedFiles}
          onClear={() => setSelectedIds(new Set())}
          onDelete={() => handleDeleteFiles(Array.from(selectedIds))}
          onMove={() => handleMove(Array.from(selectedIds))}
          onStar={(isStarred) => handleToggleStar(Array.from(selectedIds), isStarred)}
          onCopyUrl={() => selectedFiles[0] && handleCopyUrl(selectedFiles[0])}
        />
      )}

      {/* Mobile Floating Action Bar (Pill overlay, non-blocking for bulk selects) */}
      {isMobile && selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-background/95 backdrop-blur-md border border-foreground/10 px-4 h-12 rounded-full shadow-2xl flex items-center justify-between gap-4 w-[90%] max-w-[280px] animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold text-foreground">Selected</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Open Actions Bottom Sheet */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsDetailsSheetOpen(true)}
              className="h-7 text-[11px] px-3.5 rounded-full font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Actions
            </Button>

            {/* Cancel/Clear selection */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedIds(new Set())}
              className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Cancel"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Merged Details & Operations Sheet (Now manual trigger, non-blocking selects) */}
      {isMobile && (
        <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[85vh] overflow-hidden border-t">
            <div className="flex flex-col h-full overflow-hidden w-full bg-background">
              {/* Header */}
              <div className="p-4 border-b border-foreground/5 flex items-center justify-between shrink-0">
                <span className="text-sm font-bold text-foreground">
                  Item Details ({selectedIds.size} Selected)
                </span>
                <Button variant="ghost" size="icon" onClick={() => setIsDetailsSheetOpen(false)} className="h-6 w-6 rounded-md">
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4">
                  {/* Actions Grid Row on the very TOP of the sheet content */}
                  <div className="grid grid-cols-4 gap-2 mb-6 border-b border-foreground/5 pb-4">
                    {/* Star Action */}
                    <Button
                      variant="outline"
                      onClick={() => handleToggleStar(Array.from(selectedIds), !selectedFiles.every(f => f.isStarred))}
                      className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-border hover:bg-muted text-xs font-semibold"
                    >
                      <StarIcon className={cn("h-4.5 w-4.5", selectedFiles.every(f => f.isStarred) && "text-amber-500 fill-amber-500")} />
                      <span>{selectedFiles.every(f => f.isStarred) ? "Unstar" : "Star"}</span>
                    </Button>

                    {/* Rename Action (Single select only) */}
                    <Button
                      variant="outline"
                      disabled={selectedFiles.length !== 1}
                      onClick={() => {
                        setIsDetailsSheetOpen(false);
                        if (selectedFiles[0]) handleRename(selectedFiles[0]);
                      }}
                      className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-border hover:bg-muted text-xs font-semibold disabled:opacity-40"
                    >
                      <PencilIcon className="h-4.5 w-4.5" />
                      <span>Rename</span>
                    </Button>

                    {/* Move Action */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailsSheetOpen(false);
                        handleMove(Array.from(selectedIds));
                      }}
                      className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-border hover:bg-muted text-xs font-semibold"
                    >
                      <FolderIcon className="h-4.5 w-4.5" />
                      <span>Move</span>
                    </Button>

                    {/* Delete Action */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailsSheetOpen(false);
                        handleDeleteFiles(Array.from(selectedIds));
                      }}
                      className="flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-destructive/25 text-destructive hover:bg-destructive/10 text-xs font-semibold"
                    >
                      <Trash2Icon className="h-4.5 w-4.5" />
                      <span>Delete</span>
                    </Button>
                  </div>

                  {/* Details View BELOW the actions row */}
                  <div className="space-y-5">
                    {selectedFiles.length === 1 && selectedFiles[0] ? (
                      <>
                        <div className="aspect-square max-w-[240px] mx-auto rounded-xl border border-foreground/10 bg-muted/20 flex items-center justify-center overflow-hidden shadow-inner">
                          {selectedFiles[0].type.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={selectedFiles[0].url} alt={selectedFiles[0].name} className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-bold text-foreground break-all">{selectedFiles[0].name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Key: {selectedFiles[0].key}</p>
                          </div>

                          <div className="space-y-2 border-t border-foreground/5 pt-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Size</span>
                              <span className="font-semibold">{(selectedFiles[0].size / (1024 * 1024)).toFixed(2)} MB</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Kind</span>
                              <span className="font-medium uppercase">{selectedFiles[0].type.split('/')[1] || "File"}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Location</span>
                              <span className="font-medium capitalize">{selectedFiles[0].folder}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="w-16 h-16 rounded-xl border border-dashed border-foreground/15 bg-muted/10 flex items-center justify-center mb-3">
                          <ImageIcon className="h-7 w-7 text-muted-foreground/80 bg-background rounded p-0.5 border shadow-sm" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">{selectedFiles.length} Items Selected</h4>
                        <p className="text-xs text-muted-foreground mb-4">Aggregate selection summary</p>

                        <div className="w-full space-y-2 border-t border-foreground/5 pt-4 text-left">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Total Size</span>
                            <span className="font-semibold">{(selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Files Count</span>
                            <span className="font-medium">{selectedFiles.length} images</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Custom Rename Dialog Modal */}
      {renameFile && (
        <Dialog open={!!renameFile} onOpenChange={(open) => { if (!open) setRenameFile(null) }}>
          <DialogContent className="sm:max-w-md border-foreground/10 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Rename File</DialogTitle>
              <DialogDescription className="text-xs">
                Enter a new name for the file.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Input
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="text-xs h-8 border-foreground/15 focus-visible:ring-primary/20"
                placeholder="File name..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeRename()
                  }
                }}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="h-8 text-xs rounded-md" onClick={() => setRenameFile(null)}>
                Cancel
              </Button>
              <Button className="h-8 text-xs rounded-md bg-primary hover:bg-primary/90" onClick={executeRename}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Custom Move Folder Selector Dialog Modal */}
      {moveFileIds && (
        <Dialog open={!!moveFileIds} onOpenChange={(open) => { if (!open) setMoveFileIds(null) }}>
          <DialogContent className="sm:max-w-sm max-h-[80vh] overflow-hidden flex flex-col border-foreground/10 shadow-2xl">
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-sm font-bold">Move to Folder</DialogTitle>
              <DialogDescription className="text-xs">
                Select a target folder to move {moveFileIds.length} file(s).
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-1 py-2">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-8 text-xs font-medium rounded-md hover:bg-muted/80"
                  onClick={() => executeMove(moveFileIds, "uncategorized")}
                >
                  Uncategorized
                </Button>
                {folders.map(folder => (
                  <Button
                    key={folder.id}
                    variant="ghost"
                    className="w-full justify-start h-8 text-xs font-medium rounded-md hover:bg-muted/80"
                    onClick={() => executeMove(moveFileIds, folder.slug)}
                  >
                    {folder.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter className="shrink-0 pt-2 border-t">
              <Button variant="outline" className="h-8 text-xs rounded-md w-full" onClick={() => setMoveFileIds(null)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Custom Delete Files Confirmation Dialog Modal */}
      {deleteFileIds && (
        <Dialog open={!!deleteFileIds} onOpenChange={(open) => { if (!open) setDeleteFileIds(null) }}>
          <DialogContent className="sm:max-w-md border-foreground/10 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-destructive flex items-center gap-2">
                <AlertCircleIcon className="h-4.5 w-4.5 text-destructive" /> Delete {deleteFileIds.length} File(s)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Are you sure you want to permanently delete {deleteFileIds.length} selected file(s)? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="h-8 text-xs rounded-md" onClick={() => setDeleteFileIds(null)}>
                Cancel
              </Button>
              <Button variant="destructive" className="h-8 text-xs rounded-md" onClick={executeDeleteFiles}>
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Custom Delete Folder Confirmation Dialog Modal */}
      {deleteFolderSlug && (
        <Dialog open={!!deleteFolderSlug} onOpenChange={(open) => { if (!open) setDeleteFolderSlug(null) }}>
          <DialogContent className="sm:max-w-md border-foreground/10 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-destructive flex items-center gap-2">
                <AlertCircleIcon className="h-4.5 w-4.5 text-destructive" /> Delete Folder
              </DialogTitle>
              <DialogDescription className="text-xs">
                Are you sure you want to delete the folder "{folders.find(f => f.slug === deleteFolderSlug)?.name || deleteFolderSlug}"? Files inside will be moved to the Uncategorized folder.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="h-8 text-xs rounded-md" onClick={() => setDeleteFolderSlug(null)}>
                Cancel
              </Button>
              <Button variant="destructive" className="h-8 text-xs rounded-md" onClick={executeDeleteFolder}>
                Delete Folder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
