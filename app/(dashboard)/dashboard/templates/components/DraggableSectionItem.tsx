"use client"

import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { Switch } from "@/components/ui/primitives/Switch"

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
      className={`border border-hairline-light rounded-2xl overflow-hidden bg-white transition-all duration-200 ${isDragging ? 'ring-2 ring-primary/20' : ''}`}
    >
      {/* Accordion Header */}
      <div className="flex items-center justify-between p-4 bg-white hover:bg-zinc-50/50 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          {isDraggable ? (
            <div 
              {...attributes} 
              {...listeners}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1.5 text-zinc-300 w-7 h-7 flex items-center justify-center">
              {/* Spacer for alignment */}
            </div>
          )}
          <span className="font-semibold text-body-md text-ink capitalize select-none">
            {section.sectionKey.replace(/_/g, " ")}
          </span>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-shade-50 select-none">Visible</span>
            <Switch 
              checked={section.isVisible} 
              onCheckedChange={onToggleVisibility} 
            />
          </div>
          
          <div className="flex items-center gap-1 border-l border-hairline-light pl-4">
            {isDeletable ? (
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Remove section"
              >
                <Trash2 className="w-4 h-4" />
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
              className="p-1.5 text-zinc-500 hover:bg-zinc-100 rounded-full transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Accordion Body */}
      {(isExpanded && !isDragging) && (
        <div className="p-6 border-t border-hairline-light bg-zinc-50/30">
          {renderEditor()}
        </div>
      )}
    </div>
  )
}
