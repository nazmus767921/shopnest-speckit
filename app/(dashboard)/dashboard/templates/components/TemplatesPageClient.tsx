"use client"

import React, { useState, useEffect } from "react"
import { TemplatePicker } from "./TemplatePicker"
import { applyTemplateAction, updateThemeSettingsAction } from "@/app/actions/settings"
import { saveStorefrontSectionsAction, seedDefaultSectionsAction } from "@/app/actions/storefront-sections"
import { toast } from "@/components/ui/feedback/Toast"
import { Button } from "@/components/ui/primitives/Button"
import { Save, ChevronDown, ChevronRight, LayoutTemplate, Palette, LayoutList } from "lucide-react"
import { Select } from "@/components/ui/primitives/Select"
import { 
  HeroEditor, 
  AnnouncementBarEditor, 
  CategoryShowcaseEditor,
  AboutEditor,
  ProductGridEditor
} from "./SectionEditors"
import { StorefrontSection } from "@/lib/storefront-sections/types"
import { defaultStorefrontSections } from "@/lib/storefront-sections/defaults"
import { LivePreviewCanvas } from "./LivePreviewCanvas"
import { DraggableSectionItem } from "./DraggableSectionItem"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

interface TemplatesPageClientProps {
  templates: any[]
  currentTemplate: string
  initialSections: StorefrontSection[]
  initialThemeSettings?: any
}

export function TemplatesPageClient({ templates, currentTemplate, initialSections, initialThemeSettings }: TemplatesPageClientProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate)
  const [baselineSections, setBaselineSections] = useState<any[]>(initialSections)
  const [sections, setSections] = useState<any[]>(initialSections)
  
  const defaultTheme = {
    colors: { primary: "#000000", secondary: "#4b5563", background: "#ffffff", text: "#000000" },
    layout: { borderRadius: "md" }
  }
  const [baselineTheme, setBaselineTheme] = useState<any>(initialThemeSettings || defaultTheme)
  const [themeSettings, setThemeSettings] = useState<any>(initialThemeSettings || defaultTheme)
  
  const hasUnsavedSections = JSON.stringify(sections) !== JSON.stringify(baselineSections)
  const hasUnsavedTheme = JSON.stringify(themeSettings) !== JSON.stringify(baselineTheme)
  
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingTheme, setIsSavingTheme] = useState(false)
  
  // Accordion state
  const [activeAccordion, setActiveAccordion] = useState<string>("sections") // "template", "theme", "sections"
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (initialSections.length === 0) {
      handleSeedDefaults()
    }
  }, [initialSections])

  const handleSeedDefaults = async () => {
    setIsSaving(true)
    const res = await seedDefaultSectionsAction()
    if (res.success && res.seeded) {
      setSections(defaultStorefrontSections)
      toast.success("Default sections loaded.")
    } else if (!res.success) {
      toast.error(res.error || "Failed to load default sections.")
    }
    setIsSaving(false)
  }

  const handleApplyTemplate = async (slug: string) => {
    setIsSaving(true)
    const res = await applyTemplateAction(slug)
    if (res.success) {
      setSelectedTemplate(slug)
      toast.success("Template changed successfully.")
    } else {
      toast.error(res.error || "Failed to change template.")
    }
    setIsSaving(false)
  }

  const handleSaveSections = async () => {
    setIsSaving(true)
    const orderedSections = sections.map((sec, index) => ({
      ...sec,
      sortOrder: index
    }))

    const res = await saveStorefrontSectionsAction(orderedSections)
    if (res.success) {
      toast.success("Homepage sections saved successfully.")
      setSections(orderedSections)
      setBaselineSections(orderedSections)
    } else {
      toast.error(res.error || "Failed to save sections.")
    }
    setIsSaving(false)
  }

  const handleSaveThemeSettings = async () => {
    setIsSavingTheme(true)
    const res = await updateThemeSettingsAction(themeSettings)
    if (res.success) {
      toast.success("Theme settings saved successfully.")
      setBaselineTheme(themeSettings)
    } else {
      toast.error(res.error || "Failed to save theme settings.")
    }
    setIsSavingTheme(false)
  }

  const renderEditorForSection = (section: any, onChange: (newContent: any) => void) => {
    switch (section.sectionKey) {
      case "hero":
        return <HeroEditor content={section.content} onChange={onChange} />
      case "announcement_bar":
        return <AnnouncementBarEditor content={section.content} onChange={onChange} />
      case "category_showcase":
        return <CategoryShowcaseEditor content={section.content} onChange={onChange} />
      case "about":
        return <AboutEditor content={section.content} onChange={onChange} />
      case "product_grid_featured":
      case "product_grid_new_arrivals":
      case "product_grid_exclusive":
      case "product_grid":
        return <ProductGridEditor content={section.content} onChange={onChange} />
      default:
        return <div className="text-sm text-zinc-500">No editor available for {section.sectionKey}</div>
    }
  }

  const updateSectionContent = (index: number, newContent: any) => {
    const newSections = [...sections]
    newSections[index] = { ...newSections[index], content: newContent }
    setSections(newSections)
  }

  const toggleSectionVisibility = (index: number) => {
    const newSections = [...sections]
    newSections[index] = { ...newSections[index], isVisible: !newSections[index].isVisible }
    setSections(newSections)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id ? i.id === active.id : i.sectionKey === active.id)
        const newIndex = items.findIndex((i) => i.id ? i.id === over.id : i.sectionKey === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleAddSection = (sectionKey: string) => {
    const defaultSec = defaultStorefrontSections.find(s => s.sectionKey === sectionKey)
    const newSection = {
      id: `new-${Date.now()}`,
      sectionKey,
      content: defaultSec ? defaultSec.content : {},
      sortOrder: sections.length,
      isVisible: true,
      isNew: true
    }
    setSections([...sections, newSection])
    setExpandedSection(newSection.id || newSection.sectionKey)
  }

  const handleDeleteSection = (index: number) => {
    const newSections = [...sections]
    newSections.splice(index, 1)
    setSections(newSections)
  }

  const AVAILABLE_SECTIONS = [
    { key: "hero", label: "Hero Banner" },
    { key: "announcement_bar", label: "Announcement Bar" },
    { key: "category_showcase", label: "Category Showcase" },
    { key: "about", label: "About Section" },
    { key: "product_grid_featured", label: "Featured Products" },
    { key: "product_grid_new_arrivals", label: "New Arrivals" },
    { key: "product_grid_exclusive", label: "Exclusive Products" },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20 items-start">
      
      {/* Left Pane: Controls */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Accordion 1: Active Theme */}
        <div className="border border-hairline-light rounded-3xl bg-white shadow-sm">
          <button 
            className={`w-full flex items-center justify-between p-6 hover:bg-zinc-50/50 transition-colors ${activeAccordion === 'template' ? 'border-b border-hairline-light rounded-t-[23px]' : 'rounded-[23px]'}`}
            onClick={() => setActiveAccordion(activeAccordion === 'template' ? '' : 'template')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600">
                <LayoutTemplate className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start">
                <h2 className="text-heading-sm font-bold text-ink">Active Theme</h2>
                <p className="text-sm text-shade-50">Select your storefront layout</p>
              </div>
            </div>
            {activeAccordion === 'template' ? <ChevronDown className="w-5 h-5 text-zinc-400" /> : <ChevronRight className="w-5 h-5 text-zinc-400" />}
          </button>
          
          {activeAccordion === 'template' && (
            <div className="p-6 bg-zinc-50/30 rounded-b-[23px]">
              <TemplatePicker 
                templates={templates} 
                loading={false} 
                selectedTemplate={selectedTemplate} 
                onSelect={handleApplyTemplate} 
              />
            </div>
          )}
        </div>

        {/* Accordion 2: Global Theme Settings */}
        <div className="border border-hairline-light rounded-3xl bg-white shadow-sm">
          <div className={`w-full flex items-center justify-between p-6 transition-colors ${activeAccordion === 'theme' ? 'border-b border-hairline-light bg-zinc-50/50 rounded-t-[23px]' : 'hover:bg-zinc-50/50 rounded-[23px]'}`}>
            <button 
              className="flex items-center gap-4 flex-1 text-left"
              onClick={() => setActiveAccordion(activeAccordion === 'theme' ? '' : 'theme')}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 relative">
                <Palette className="w-5 h-5" />
                {hasUnsavedTheme && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>}
              </div>
              <div className="flex flex-col items-start">
                <h2 className="text-heading-sm font-bold text-ink flex items-center gap-2">
                  Global Theme Settings
                  {hasUnsavedTheme && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Unsaved</span>}
                </h2>
                <p className="text-sm text-shade-50">Colors and typography</p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              {activeAccordion === 'theme' && (
                <Button 
                  onClick={handleSaveThemeSettings} 
                  disabled={isSavingTheme || !hasUnsavedTheme}
                  className={`rounded-full shadow-sm ${hasUnsavedTheme ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent' : ''}`}
                >
                  {isSavingTheme ? "Saving..." : "Save"}
                </Button>
              )}
              <button onClick={() => setActiveAccordion(activeAccordion === 'theme' ? '' : 'theme')}>
                {activeAccordion === 'theme' ? <ChevronDown className="w-5 h-5 text-zinc-400" /> : <ChevronRight className="w-5 h-5 text-zinc-400" />}
              </button>
            </div>
          </div>
          
          {activeAccordion === 'theme' && (
            <div className="p-6 bg-zinc-50/30 flex flex-col gap-8 rounded-b-[23px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Colors */}
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-body-md text-ink">Colors</h3>
                  <div className="flex flex-col gap-3">
                    {['primary', 'secondary', 'background', 'text'].map((colorKey) => (
                      <div key={colorKey} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-shade-75 capitalize">{colorKey} Color</label>
                        <div className="flex items-center gap-2 bg-white border border-hairline-light p-1 rounded-full shadow-sm pl-2">
                          <input 
                            type="text"
                            value={themeSettings.colors?.[colorKey] || "#000000"}
                            onChange={(e) => setThemeSettings({
                              ...themeSettings,
                              colors: { ...themeSettings.colors, [colorKey]: e.target.value }
                            })}
                            className="w-16 bg-transparent border-none p-0 text-xs uppercase font-medium focus:ring-0 text-zinc-600"
                          />
                          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-hairline-light">
                            <input 
                              type="color" 
                              value={themeSettings.colors?.[colorKey] || "#000000"} 
                              onChange={(e) => setThemeSettings({
                                ...themeSettings,
                                colors: { ...themeSettings.colors, [colorKey]: e.target.value }
                              })}
                              className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer border-0 p-0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Layout */}
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-body-md text-ink">Layout & Styling</h3>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-shade-75">Border Radius</label>
                    {(() => {
                      const RADIUS_OPTIONS = [
                        { value: "none", label: "None (Sharp)" },
                        { value: "sm", label: "Small (Slightly rounded)" },
                        { value: "md", label: "Medium (Standard)" },
                        { value: "lg", label: "Large (Rounded)" },
                        { value: "full", label: "Full (Pill/Circular)" }
                      ];
                      const currentVal = themeSettings.layout?.borderRadius || "md";
                      const currentOpt = RADIUS_OPTIONS.find(o => o.value === currentVal) || RADIUS_OPTIONS[2];
                      
                      return (
                        <Select
                          options={RADIUS_OPTIONS}
                          value={currentOpt}
                          onChange={(opt) => {
                            if (opt) {
                              setThemeSettings({
                                ...themeSettings,
                                layout: { ...themeSettings.layout, borderRadius: opt.value }
                              })
                            }
                          }}
                          getOptionLabel={(opt) => opt.label}
                          getOptionValue={(opt) => opt.value}
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: Homepage Sections Editor */}
        <div className="border border-hairline-light rounded-3xl bg-white shadow-sm">
          <div className={`w-full flex items-center justify-between p-6 transition-colors ${activeAccordion === 'sections' ? 'border-b border-hairline-light bg-zinc-50/50 rounded-t-[23px]' : 'hover:bg-zinc-50/50 rounded-[23px]'}`}>
            <button 
              className="flex items-center gap-4 flex-1 text-left"
              onClick={() => setActiveAccordion(activeAccordion === 'sections' ? '' : 'sections')}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 relative">
                <LayoutList className="w-5 h-5" />
                {hasUnsavedSections && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>}
              </div>
              <div className="flex flex-col items-start">
                <h2 className="text-heading-sm font-bold text-ink flex items-center gap-2">
                  Homepage Sections
                  {hasUnsavedSections && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Unsaved</span>}
                </h2>
                <p className="text-sm text-shade-50">Manage content blocks</p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              {activeAccordion === 'sections' && (
                <Button 
                  onClick={handleSaveSections} 
                  disabled={isSaving || !hasUnsavedSections}
                  className={`rounded-full shadow-sm ${hasUnsavedSections ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent' : ''}`}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              )}
              <button onClick={() => setActiveAccordion(activeAccordion === 'sections' ? '' : 'sections')}>
                {activeAccordion === 'sections' ? <ChevronDown className="w-5 h-5 text-zinc-400" /> : <ChevronRight className="w-5 h-5 text-zinc-400" />}
              </button>
            </div>
          </div>
          
          {activeAccordion === 'sections' && (
            <div className="p-6 bg-zinc-50/30 flex flex-col gap-6 rounded-b-[23px]">
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-shade-50 max-w-[200px]">
                  Drag to reorder sections.
                </p>
                <div className="w-48">
                  <Select
                    options={AVAILABLE_SECTIONS.filter(s => !sections.some(sec => sec.sectionKey === s.key))}
                    value={null}
                    onChange={(option) => {
                      if (option) {
                        handleAddSection(option.key)
                      }
                    }}
                    getOptionLabel={(opt) => opt.label}
                    getOptionValue={(opt) => opt.key}
                    placeholder="+ Add Section"
                    noOptionsMessage="All sections added"
                    className="!py-0"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={sections.map(s => s.id || s.sectionKey)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sections.map((section, index) => {
                      const id = section.id || section.sectionKey
                      const isExpanded = expandedSection === id
                      
                      return (
                        <DraggableSectionItem 
                          key={id}
                          id={id}
                          section={section}
                          index={index}
                          isExpanded={isExpanded}
                          onToggleExpand={() => setExpandedSection(isExpanded ? null : id)}
                          onToggleVisibility={() => toggleSectionVisibility(index)}
                          onDelete={() => handleDeleteSection(index)}
                          renderEditor={() => renderEditorForSection(section, (newContent) => updateSectionContent(index, newContent))}
                        />
                      )
                    })}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}
        </div>
        
      </div>

      {/* Right Pane: Live Preview Canvas */}
      <div className="lg:col-span-7">
        <LivePreviewCanvas 
          sections={sections} 
          themeSettings={themeSettings} 
        />
      </div>

    </div>
  )
}
