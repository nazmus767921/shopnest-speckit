"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SectionType } from "./VisualEditor"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

const AVAILABLE_SECTIONS = [
  { type: "hero", label: "Hero Banner" },
  { type: "featured_products", label: "Featured Products" },
  { type: "category_showcase", label: "Categories" },
  { type: "promo_banner", label: "Promo Banner" },
  { type: "footer", label: "Footer" },
]

function SortableItem({ section, onRemove }: { section: SectionType; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  
  const label = AVAILABLE_SECTIONS.find(s => s.type === section.type)?.label || section.type

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 mb-2 bg-background border rounded-md shadow-sm group"
    >
      <div className="flex items-center gap-2" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRemove(section.id)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}

interface SidebarProps {
  layout: SectionType[]
  onAddSection: (type: string) => void
  onRemoveSection: (id: string) => void
}

export default function Sidebar({ layout, onAddSection, onRemoveSection }: SidebarProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 p-4 border-b">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Active Layout</h3>
        
        {layout.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No sections added yet.
          </div>
        ) : (
          <SortableContext items={layout.map(l => l.id)} strategy={verticalListSortingStrategy}>
            {layout.map((section) => (
              <SortableItem key={section.id} section={section} onRemove={onRemoveSection} />
            ))}
          </SortableContext>
        )}
      </ScrollArea>
      
      <ScrollArea className="flex-1 p-4 bg-muted/10">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Add Section</h3>
        <div className="grid gap-2">
          {AVAILABLE_SECTIONS.map((section) => (
            <Button
              key={section.type}
              variant="outline"
              className="justify-start"
              onClick={() => onAddSection(section.type)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {section.label}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
