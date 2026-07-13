"use client"

import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVerticalIcon, Trash2Icon, ChevronUpIcon, ChevronDownIcon } from "@/lib/icons";

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface DraggableSectionItemProps {
  id: string
  section: any
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleVisibility: () => void
  onDelete: () => void
  renderEditor: () => React.ReactNode
  isDraggable?: boolean
  isDeletable?: boolean
}

export function DraggableSectionItem({
  id,
  section,
  index,
  isExpanded,
  onToggleExpand,
  onToggleVisibility,
  onDelete,
  renderEditor,
  isDraggable = true,
  isDeletable = true
}: DraggableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: !isDraggable })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "border border-border rounded-xl overflow-hidden bg-card text-foreground transition-all duration-200",
        isDragging ? "ring-2 ring-primary/20" : ""
      )}
    >
      {/* Accordion Header */}
      <div className="flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          {isDraggable ? (
            <div 
              {...attributes} 
              {...listeners}
              style={{ touchAction: "none" }}
              className="p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded-md cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVerticalIcon className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1.5 text-muted-foreground/20 w-7 h-7 flex items-center justify-center">
              {/* Spacer for alignment */}
            </div>
          )}
          <span className="text-sm font-semibold text-foreground capitalize select-none">
            {section.sectionKey.replace(/_/g, " ")}
          </span>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground select-none">Visible</span>
            <Switch 
              checked={section.isVisible} 
              onCheckedChange={onToggleVisibility} 
            />
          </div>
          
          <div className="flex items-center gap-1 border-l border-border pl-4">
            {isDeletable ? (
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 text-muted-foreground/65 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors cursor-pointer"
                title="Remove section"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-7 h-7" />
            )}
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-1.5 text-muted-foreground/65 hover:bg-muted rounded-full transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Accordion Body */}
      {(isExpanded && !isDragging) && (
        <div className="p-6 border-t border-border bg-muted/30">
          {renderEditor()}
        </div>
      )}
    </div>
  )
}
