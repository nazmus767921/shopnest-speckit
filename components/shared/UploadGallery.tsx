"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import {
  createMediaFileAction,
  getMediaFilesAction,
  getMediaFoldersAction,
} from "@/app/actions/media"
import {
  UploadCloudIcon,
  XIcon,
  Trash2Icon,
  CheckIcon,
  SearchIcon,
  StarIcon,
  FolderIcon,
  Loader2Icon,
  ImageIcon,
  GripVerticalIcon,
  PlusIcon,
} from "@/lib/icons"
import { cn } from "@/lib/utils"

// Types
export interface MediaImage {
  id: string
  url: string
  key: string
  name: string
  size: number
  type: string
  folder?: string
  isStarred?: boolean
}

interface UploadGalleryProps {
  maxFiles?: number
  multiple?: boolean
  allowedTypes?: string[]
  maxFileSize?: number // in MB
  onImagesChange: (images: MediaImage[]) => void
  initialImages?: Array<string | MediaImage>
  defaultFolder?: string
}

interface UploadingFile {
  id: string
  name: string
  size: number
  progress: number
  previewUrl: string
  error?: string
}

// ─── Drag & Drop Sortable Image Card Sub-component ───────────────────────────
interface SortableCardProps {
  image: MediaImage
  isPrimary: boolean
  onRemove: (id: string) => void
}

function SortableImageCard({ image, isPrimary, onRemove }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id })

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
    touchAction: "none", // CRITICAL for mobile touch sensors to work in Chrome/Safari!
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative aspect-square rounded-xl border border-border bg-muted overflow-hidden flex items-center justify-center transition-all shadow-sm hover:shadow-md select-none cursor-grab active:cursor-grabbing",
        isPrimary ? "col-span-2 row-span-2 border-primary/40 ring-1 ring-primary/20" : "col-span-1 row-span-1",
        isDragging && "ring-2 ring-primary border-primary scale-[0.98]"
      )}
    >
      {/* Image Render */}
      <img
        src={image.url}
        alt={image.name}
        className="w-full h-full object-cover pointer-events-none"
      />

      {/* Primary Badge */}
      {isPrimary && (
        <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10 select-none">
          Cover Photo
        </span>
      )}

      {/* Bottom Glassmorphic Action Strip */}
      <div className="absolute bottom-0 inset-x-0 bg-background/85 backdrop-blur-md border-t border-border flex items-center justify-between px-3 py-2 text-xs opacity-90 group-hover:opacity-100 transition-opacity">
        {/* Grip Indicator */}
        <div className="flex items-center gap-1.5 text-muted-foreground select-none">
          <GripVerticalIcon className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium hidden sm:inline">
            Drag
          </span>
        </div>

        {/* Delete button (prevent drag propagation) */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onRemove(image.id)
          }}
          title="Delete Image"
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Name tag */}
      <div className="absolute top-3 right-3 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded pointer-events-none select-none opacity-0 group-hover:opacity-100 transition-opacity max-w-[120px] truncate">
        {image.name}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function UploadGallery({
  maxFiles = 5,
  multiple = true,
  allowedTypes = ["image/jpeg", "image/png", "image/webp"],
  maxFileSize = 2, // MB
  onImagesChange,
  initialImages = [],
  defaultFolder = "uncategorized",
}: UploadGalleryProps) {
  const [selectedImages, setSelectedImages] = useState<MediaImage[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"upload" | "gallery">("upload")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  // Gallery Modal states
  const [galleryFiles, setGalleryFiles] = useState<MediaImage[]>([])
  const [galleryFolders, setGalleryFolders] = useState<Array<{ name: string; slug: string }>>([])
  const [isGalleryLoading, setIsGalleryLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("all")
  const [onlyStarred, setOnlyStarred] = useState(false)
  const [modalSelections, setModalSelections] = useState<Record<string, MediaImage>>({})

  // Sensors for DnD kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Map initial images
  const initialImagesSerialized = JSON.stringify(
    initialImages?.map((img) => (typeof img === "string" ? img : img.key))
  )

  useEffect(() => {
    if (!initialImages) {
      setSelectedImages([])
      return
    }

    const initialKeys = initialImages.map((img) => (typeof img === "string" ? img : img.key))
    const currentKeys = selectedImages.map((img) => img.key)
    
    const isSame = 
      initialKeys.length === currentKeys.length && 
      initialKeys.every((key, idx) => key === currentKeys[idx])

    if (isSame) return

    const mapped = initialImages.map((img) => {
      if (typeof img === "string") {
        const name = img.split("/").pop() || "image"
        const cleanPath = img.replace(/^product-images\//, "")
        const resolvedUrl = supabase.storage.from("media").getPublicUrl(cleanPath).data.publicUrl
        return {
          id: img,
          url: resolvedUrl,
          key: img,
          name,
          size: 0,
          type: "image/unknown",
        }
      }
      return img
    })
    setSelectedImages(mapped)
  }, [initialImagesSerialized])

  // Fire callback to parent on change
  const handleImagesUpdated = useCallback((newImages: MediaImage[]) => {
    setSelectedImages(newImages)
    onImagesChange(newImages)
  }, [onImagesChange])

  // Fetch gallery media files
  const loadGallery = useCallback(async () => {
    setIsGalleryLoading(true)
    try {
      const [filesRes, foldersRes] = await Promise.all([
        getMediaFilesAction(),
        getMediaFoldersAction(),
      ])

      if (filesRes.success && filesRes.files) {
        setGalleryFiles(filesRes.files as MediaImage[])
      } else {
        toast.error("Failed to load gallery images: " + (filesRes.error || ""))
      }

      if (foldersRes.success && foldersRes.folders) {
        setGalleryFolders(foldersRes.folders)
      }
    } catch (err: any) {
      toast.error("Error loading gallery data: " + err.message)
    } finally {
      setIsGalleryLoading(false)
    }
  }, [])

  // Open Gallery modal
  const openGalleryModal = useCallback(() => {
    setIsGalleryOpen(true)
    const currentSelections: Record<string, MediaImage> = {}
    selectedImages.forEach((img) => {
      currentSelections[img.id] = img
    })
    setModalSelections(currentSelections)
    loadGallery()
  }, [selectedImages, loadGallery])

  // Tab changer triggers modal when switching to gallery
  const handleTabChange = (value: string) => {
    if (value === "gallery") {
      openGalleryModal()
      setActiveTab("upload")
    } else {
      setActiveTab("upload")
    }
  }

  // File validator helper
  const validateFile = useCallback((file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`
    }
    const maxBytes = maxFileSize * 1024 * 1024
    if (file.size > maxBytes) {
      return `File size exceeds the limit of ${maxFileSize}MB.`
    }
    return null
  }, [allowedTypes, maxFileSize])

  // Perform upload logic for a single file
  const uploadFile = useCallback(async (file: File) => {
    const tempId = crypto.randomUUID()
    const tempUrl = URL.createObjectURL(file)

    const newTempFile: UploadingFile = {
      id: tempId,
      name: file.name,
      size: file.size,
      progress: 10,
      previewUrl: tempUrl,
    }

    setUploadingFiles((prev) => [...prev, newTempFile])

    const interval = setInterval(() => {
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === tempId && f.progress < 85 ? { ...f, progress: f.progress + 15 } : f))
      )
    }, 150)

    try {
      const fileExt = file.name.split(".").pop()
      const storageKey = `${crypto.randomUUID()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("media")
        .upload(storageKey, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(storageKey)

      const dbRes = await createMediaFileAction({
        url: publicUrl,
        key: uploadData.path,
        name: file.name,
        size: file.size,
        type: file.type,
        folder: defaultFolder,
      })

      clearInterval(interval)

      if (!dbRes.success) throw new Error(dbRes.error || "Failed to register media file metadata")

      const finalMediaImage: MediaImage = dbRes.file as MediaImage

      setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId))

      setSelectedImages((prev) => {
        let updated: MediaImage[]
        if (!multiple) {
          updated = [finalMediaImage]
        } else {
          if (prev.length >= maxFiles) {
            toast.warning(`Maximum file limit of ${maxFiles} reached. Replacement occurred.`)
            updated = [...prev.slice(1), finalMediaImage]
          } else {
            updated = [...prev, finalMediaImage]
          }
        }
        onImagesChange(updated)
        return updated
      })

      toast.success(`Uploaded ${file.name} successfully`)
    } catch (err: any) {
      clearInterval(interval)
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === tempId ? { ...f, progress: 100, error: err.message } : f))
      )
      toast.error(`Failed to upload ${file.name}: ${err.message}`)
    }
  }, [multiple, maxFiles, defaultFolder, onImagesChange])

  // Handle files selection/drop
  const handleFilesAdded = useCallback((files: File[]) => {
    if (files.length === 0) return

    let filesToProcess = files
    if (!multiple) {
      filesToProcess = [files[0]]
    } else {
      const remainingSlots = maxFiles - selectedImages.length
      if (files.length > remainingSlots) {
        toast.warning(`You can only select up to ${maxFiles} images. Only processing the first ${remainingSlots} slots.`)
        filesToProcess = files.slice(0, remainingSlots)
      }
    }

    filesToProcess.forEach((file) => {
      const error = validateFile(file)
      if (error) {
        toast.error(error)
      } else {
        uploadFile(file)
      }
    })
  }, [multiple, maxFiles, selectedImages.length, validateFile, uploadFile])

  // Drag-and-drop dropzone handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    if (e.dataTransfer.files) {
      handleFilesAdded(Array.from(e.dataTransfer.files))
    }
  }

  // Browse files click handler
  const triggerFileBrowser = () => {
    fileInputRef.current?.click()
  }

  // Remove preview item
  const handleRemoveImage = useCallback((id: string) => {
    const updated = selectedImages.filter((img) => img.id !== id)
    handleImagesUpdated(updated)
  }, [selectedImages, handleImagesUpdated])

  // Drag previews ended
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSelectedImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const updated = arrayMove(items, oldIndex, newIndex)
        onImagesChange(updated)
        return updated
      })
    }
  }

  // Modal Selection Toggle
  const toggleModalSelection = (image: MediaImage) => {
    setModalSelections((prev) => {
      const updated = { ...prev }
      if (updated[image.id]) {
        delete updated[image.id]
      } else {
        if (!multiple) {
          return { [image.id]: image }
        }
        if (Object.keys(updated).length >= maxFiles) {
          toast.warning(`Cannot select more than ${maxFiles} images.`)
          return prev
        }
        updated[image.id] = image
      }
      return updated
    })
  }

  // Confirm Gallery Selection
  const confirmGallerySelection = () => {
    const newSelections = Object.values(modalSelections)
    handleImagesUpdated(newSelections)
    setIsGalleryOpen(false)
    toast.success("Gallery selection updated")
  }

  // Filter gallery items
  const filteredGalleryFiles = galleryFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFolder = selectedFolder === "all" || file.folder === selectedFolder
    const matchesStarred = !onlyStarred || file.isStarred
    return matchesSearch && matchesFolder && matchesStarred
  })

  // Calculation of occupied items
  const occupiedCount = selectedImages.length + uploadingFiles.length
  const emptySlotsCount = Math.max(0, maxFiles - occupiedCount)

  return (
    <div className="w-full flex flex-col gap-4 text-foreground">
      {/* Drag and Drop Grid Wrapper */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border border-dashed rounded-2xl p-4 transition-all bg-background min-h-[220px]",
          isDraggingOver
            ? "border-primary/80 bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/20 hover:border-primary/30"
        )}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          multiple={multiple}
          accept={allowedTypes.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFilesAdded(Array.from(e.target.files))
            }
          }}
        />

        {/* Drag Overlay State */}
        {isDraggingOver && (
          <div className="absolute inset-0 bg-primary/5 backdrop-blur-[1px] rounded-2xl z-30 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
            <div className="p-4 bg-background text-primary rounded-full border border-primary/20 shadow-md">
              <UploadCloudIcon className="h-8 w-8 animate-bounce text-primary" />
            </div>
            <span className="text-sm font-semibold text-primary mt-3">Drop files to upload</span>
          </div>
        )}

        {/* Layout Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={selectedImages.map((img) => img.id)} strategy={rectSortingStrategy}>
              {selectedImages.map((image, idx) => (
                <SortableImageCard
                  key={image.id}
                  image={image}
                  isPrimary={idx === 0}
                  onRemove={handleRemoveImage}
                />
              ))}

              {/* Uploading placeholders */}
              {uploadingFiles.map((file, idx) => {
                const isFirst = occupiedCount - uploadingFiles.length + idx === 0
                return (
                  <div
                    key={file.id}
                    className={cn(
                      "relative aspect-square rounded-2xl border border-border overflow-hidden bg-muted flex flex-col items-center justify-center p-3 text-center",
                      isFirst ? "col-span-2 row-span-2" : "col-span-1 row-span-1"
                    )}
                  >
                    <img src={file.previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-35" />
                    <div className="z-10 flex flex-col items-center gap-1.5 w-full px-2">
                      {file.error ? (
                        <>
                          <XIcon className="h-5 w-5 text-destructive animate-pulse" />
                          <span className="text-[10px] text-destructive font-medium line-clamp-2">Error</span>
                        </>
                      ) : (
                        <>
                          <Loader2Icon className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-[9px] text-muted-foreground truncate w-full">{file.name}</span>
                          <div className="w-full bg-border h-1 rounded-full overflow-hidden mt-1">
                            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${file.progress}%` }} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </SortableContext>
          </DndContext>

          {/* Dash placeholders for remaining slots */}
          {Array.from({ length: emptySlotsCount }).map((_, idx) => {
            const isFirstPlaceholder = occupiedCount === 0 && idx === 0
            return (
              <button
                key={`placeholder-${idx}`}
                type="button"
                onClick={triggerFileBrowser}
                className={cn(
                  "border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-accent/5 rounded-2xl flex flex-col items-center justify-center aspect-square gap-2.5 transition-all group cursor-pointer",
                  isFirstPlaceholder ? "col-span-2 row-span-2" : "col-span-1 row-span-1"
                )}
              >
                <div className={cn(
                  "p-3 rounded-full bg-muted/50 text-muted-foreground group-hover:scale-110 transition-transform",
                  isFirstPlaceholder && "p-4 bg-primary/5 text-primary border border-primary/10"
                )}>
                  <PlusIcon className={cn("h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors", isFirstPlaceholder && "h-6 w-6 text-primary")} />
                </div>
                <span className={cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none", isFirstPlaceholder && "text-xs text-foreground normal-case font-bold mt-1")}>
                  {isFirstPlaceholder ? "Add Cover Photo" : "Add Image"}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab controls below dropzone */}
      <div className="w-full flex items-center justify-between border border-border p-1 bg-muted/30 rounded-xl">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent">
            <TabsTrigger value="upload" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Media Gallery
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Reusable Gallery Modal/Dialog */}
      <Dialog isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)}>
        <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-6 gap-4">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <span>Media Library</span>
              <span className="text-xs bg-muted text-muted-foreground font-normal px-2.5 py-0.5 rounded-full">
                {Object.keys(modalSelections).length} / {maxFiles} Selected
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Filtering Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search files by name..."
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Folder Select Dropdown */}
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="bg-background text-foreground border border-border rounded-lg text-xs h-9 px-3 outline-none focus:ring-1 focus:ring-primary w-[160px]"
                >
                  <option value="all">All Folders</option>
                  <option value="uncategorized">Uncategorized</option>
                  {galleryFolders.map((fold) => (
                    <option key={fold.slug} value={fold.slug}>
                      {fold.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Starred Filter Button */}
              <Button
                type="button"
                variant={onlyStarred ? "default" : "outline"}
                size="sm"
                className="h-9 px-3"
                onClick={() => setOnlyStarred(!onlyStarred)}
              >
                <StarIcon className={cn("h-4 w-4 mr-1.5", onlyStarred && "fill-primary-foreground text-yellow-400")} />
                Starred
              </Button>
            </div>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto min-h-[300px] border border-border rounded-xl bg-accent/5 p-4">
            {isGalleryLoading ? (
              <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center gap-2">
                <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-medium">Loading media...</span>
              </div>
            ) : filteredGalleryFiles.length === 0 ? (
              <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 gap-2">
                <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-semibold">No media files found</p>
                <p className="text-xs text-muted-foreground">
                  Try uploading some files or clearing your filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {filteredGalleryFiles.map((file) => {
                  const isSelected = !!modalSelections[file.id]
                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleModalSelection(file)}
                      className={cn(
                        "group relative aspect-square rounded-lg overflow-hidden border border-border bg-card cursor-pointer hover:scale-[1.02] transition-all",
                        isSelected && "ring-2 ring-primary border-primary scale-[0.98]"
                      )}
                    >
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />

                      {/* Folder Tag overlay */}
                      <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-mono select-none">
                        {file.folder === "uncategorized" ? "general" : file.folder}
                      </span>

                      {/* Selected Overlay & Checkmark */}
                      {isSelected ? (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center transition-all">
                          <div className="bg-primary text-primary-foreground p-1 rounded-full shadow-lg scale-110 animate-in zoom-in-50 duration-150">
                            <CheckIcon className="h-3 w-3 stroke-[3]" />
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-all" />
                      )}

                      {/* Starred badge */}
                      {file.isStarred && (
                        <div className="absolute top-1.5 right-1.5 bg-yellow-500/90 text-white p-0.5 rounded-full shadow-sm">
                          <StarIcon className="h-2.5 w-2.5 fill-current text-white" />
                        </div>
                      )}

                      {/* Name tag */}
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] px-1.5 py-0.5 truncate select-none opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.name}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer controls */}
          <div className="flex justify-between items-center border-t border-border pt-3">
            <span className="text-xs text-muted-foreground font-medium">
              Showing {filteredGalleryFiles.length} of {galleryFiles.length} files
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsGalleryOpen(false)}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={confirmGallerySelection}>
                Confirm Selection ({Object.keys(modalSelections).length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
