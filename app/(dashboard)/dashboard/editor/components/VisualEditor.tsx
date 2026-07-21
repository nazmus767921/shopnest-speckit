"use client"

import { useState, useEffect, useRef } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import Sidebar from "./Sidebar"
import LivePreviewIframe from "./LivePreviewIframe"
import { saveLayout } from "../actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export type SectionType = {
  id: string
  type: string
  settings: Record<string, any>
}

interface VisualEditorProps {
  initialLayout: SectionType[]
  previewUrl: string
}

export default function VisualEditor({ initialLayout, previewUrl }: VisualEditorProps) {
  const [layout, setLayout] = useState<SectionType[]>(initialLayout)
  const [isSaving, setIsSaving] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_LAYOUT', layout }, '*')
    }
  }, [layout])

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setLayout((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleAddSection = (type: string) => {
    setLayout((prev) => [
      ...prev,
      {
        id: `section-${crypto.randomUUID()}`,
        type,
        settings: {},
      },
    ])
  }

  const handleRemoveSection = (id: string) => {
    setLayout((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSave = async () => {
    setIsSaving(true)
    const result = await saveLayout(layout)
    setIsSaving(false)
    if (result.success) {
      toast.success("Layout saved successfully")
    } else {
      toast.error(result.error || "Failed to save layout")
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-background">
          <h2 className="font-semibold">Editor</h2>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Sidebar 
            layout={layout} 
            onAddSection={handleAddSection} 
            onRemoveSection={handleRemoveSection} 
          />
        </DndContext>
      </div>
      
      <div className="flex-1 bg-muted p-4">
        <LivePreviewIframe 
          ref={iframeRef} 
          previewUrl={previewUrl} 
          initialLayout={layout}
        />
      </div>
    </div>
  )
}
