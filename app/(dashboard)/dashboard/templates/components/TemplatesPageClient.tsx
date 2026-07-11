"use client"

import React, { useState, useEffect } from "react"
import { TemplatePicker } from "./TemplatePicker"
import { applyTemplateAction, updateThemeSettingsAction } from "@/app/actions/settings"
import { saveStorefrontSectionsAction, seedDefaultSectionsAction } from "@/app/actions/storefront-sections"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { SaveIcon, ChevronDownIcon, ChevronRightIcon, LayoutTemplateIcon, PaletteIcon, LayoutListIcon, PlusIcon } from "@/lib/icons";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  HeroEditor,
  AnnouncementBarEditor,
  CategoryShowcaseEditor,
  AboutEditor,
  ProductGridEditor,
  FaqEditor,
  FooterEditor
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
  const getSectionsWithFooter = (secs: any[]) => {
    if (secs.length === 0) return secs
    if (secs.some(s => s.sectionKey === "footer")) return secs
    const defaultFooter = defaultStorefrontSections.find(s => s.sectionKey === "footer")
    return [...secs, {
      id: `new-footer-${Date.now()}`,
      sectionKey: "footer",
      content: defaultFooter?.content || {},
      sortOrder: 9999,
      isVisible: true,
      isNew: true
    }]
  }

  const [baselineSections, setBaselineSections] = useState<any[]>(initialSections)
  const [sections, setSections] = useState<any[]>(getSectionsWithFooter(initialSections))

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
      case "faq":
        return <FaqEditor content={section.content} onChange={onChange} />
      case "footer":
        return <FooterEditor content={section.content} onChange={onChange} />
      default:
        return <div className="text-sm text-muted-foreground">No editor available for {section.sectionKey}</div>
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
        const oldIndex = items.findIndex((i) => (i.id || i.sectionKey) === active.id)
        const newIndex = items.findIndex((i) => (i.id || i.sectionKey) === over.id)

        let newItems = arrayMove(items, oldIndex, newIndex)

        const footerIndex = newItems.findIndex(i => i.sectionKey === "footer")
        if (footerIndex !== -1 && footerIndex !== newItems.length - 1) {
          const footerItem = newItems.splice(footerIndex, 1)[0]
          newItems.push(footerItem)
        }

        return newItems
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

    setSections(prev => {
      const footerIndex = prev.findIndex(s => s.sectionKey === "footer")
      if (footerIndex !== -1) {
        const newSections = [...prev]
        newSections.splice(footerIndex, 0, newSection)
        return newSections
      }
      return [...prev, newSection]
    })

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
    { key: "faq", label: "FAQ Section" },
    { key: "footer", label: "Footer" }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20 items-start text-foreground">

      {/* Left Pane: Controls */}
      <div className="lg:col-span-5 flex flex-col gap-6">

        {/* Accordion 1: Active Theme */}
        <div className="border border-border rounded-xl bg-card">
          <button
            className={`w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors ${activeAccordion === 'template' ? 'border-b border-border rounded-t-xl' : 'rounded-xl'}`}
            onClick={() => setActiveAccordion(activeAccordion === 'template' ? '' : 'template')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <LayoutTemplateIcon className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start">
                <h2 className="text-base font-bold">Active Theme</h2>
                <p className="text-sm text-muted-foreground">Select your storefront layout</p>
              </div>
            </div>
            {activeAccordion === 'template' ? <ChevronDownIcon className="w-5 h-5 text-muted-foreground" /> : <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />}
          </button>

          {activeAccordion === 'template' && (
            <div className="p-6 bg-muted/30 rounded-b-xl">
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
        <div className="border border-border rounded-xl bg-card">
          <div className={`w-full flex items-center justify-between p-6 transition-colors ${activeAccordion === 'theme' ? 'border-b border-border bg-muted/50 rounded-t-xl' : 'hover:bg-muted/50 rounded-xl'}`}>
            <button
              className="flex items-center gap-4 flex-1 text-left"
              onClick={() => setActiveAccordion(activeAccordion === 'theme' ? '' : 'theme')}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground relative">
                <PaletteIcon className="w-5 h-5" />
                {hasUnsavedTheme && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-background"></span>}
              </div>
              <div className="flex flex-col items-start">
                <h2 className="text-base font-bold flex items-center gap-2">
                  Global Theme Settings
                  {hasUnsavedTheme && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">Unsaved</span>}
                </h2>
                <p className="text-sm text-muted-foreground">Colors and typography</p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              {activeAccordion === 'theme' && (
                <Button
                  onClick={handleSaveThemeSettings}
                  disabled={isSavingTheme || !hasUnsavedTheme}
                  className={`rounded-md ${hasUnsavedTheme ? 'bg-amber-500 hover:bg-amber-600 text-white dark:text-black border-transparent' : ''}`}
                >
                  {isSavingTheme ? "Saving..." : "Save"}
                </Button>
              )}
              <button onClick={() => setActiveAccordion(activeAccordion === 'theme' ? '' : 'theme')}>
                {activeAccordion === 'theme' ? <ChevronDownIcon className="w-5 h-5 text-muted-foreground" /> : <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {activeAccordion === 'theme' && (
            <div className="p-6 bg-muted/30 flex flex-col gap-8 rounded-b-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Colors */}
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-sm">Colors</h3>
                  <div className="flex flex-col gap-3">
                    {['primary', 'secondary', 'background', 'text'].map((colorKey) => (
                      <div key={colorKey} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-muted-foreground capitalize">{colorKey} Color</label>
                        <div className="flex items-center gap-2 bg-background border border-border p-1 rounded-full pl-2">
                          <input
                            type="text"
                            value={themeSettings.colors?.[colorKey] || "#000000"}
                            onChange={(e) => setThemeSettings({
                              ...themeSettings,
                              colors: { ...themeSettings.colors, [colorKey]: e.target.value }
                            })}
                            className="w-16 bg-transparent border-none p-0 text-xs uppercase font-medium focus:ring-0 text-foreground"
                          />
                          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-border">
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
                  <h3 className="font-semibold text-sm">Layout & Styling</h3>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-muted-foreground">Border Radius</label>
                    <Select
                      value={themeSettings.layout?.borderRadius || "md"}
                      onValueChange={(val) => setThemeSettings({
                        ...themeSettings,
                        layout: { ...themeSettings.layout, borderRadius: val }
                      })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Border Radius" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Sharp)</SelectItem>
                        <SelectItem value="sm">Small (Slightly rounded)</SelectItem>
                        <SelectItem value="md">Medium (Standard)</SelectItem>
                        <SelectItem value="lg">Large (Rounded)</SelectItem>
                        <SelectItem value="full">Full (Pill/Circular)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: Homepage Sections Editor */}
        <div className="border border-border rounded-xl bg-card">
          <div className={`w-full flex items-center justify-between p-6 transition-colors ${activeAccordion === 'sections' ? 'border-b border-border bg-muted/50 rounded-t-xl' : 'hover:bg-muted/50 rounded-xl'}`}>
            <button
              className="flex items-center gap-4 flex-1 text-left"
              onClick={() => setActiveAccordion(activeAccordion === 'sections' ? '' : 'sections')}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground relative">
                <LayoutListIcon className="w-5 h-5" />
                {hasUnsavedSections && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-background"></span>}
              </div>
              <div className="flex flex-col items-start">
                <h2 className="text-base font-bold flex items-center gap-2">
                  Homepage Sections
                  {hasUnsavedSections && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">Unsaved</span>}
                </h2>
                <p className="text-sm text-muted-foreground">Manage content blocks</p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              {activeAccordion === 'sections' && (
                <Button
                  onClick={handleSaveSections}
                  disabled={isSaving || !hasUnsavedSections}
                  className={`rounded-md ${hasUnsavedSections ? 'bg-amber-500 hover:bg-amber-600 text-white dark:text-black border-transparent' : ''}`}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              )}
              <button onClick={() => setActiveAccordion(activeAccordion === 'sections' ? '' : 'sections')}>
                {activeAccordion === 'sections' ? <ChevronDownIcon className="w-5 h-5 text-muted-foreground" /> : <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {activeAccordion === 'sections' && (
            <div className="p-6 bg-muted/30 flex flex-col gap-6 rounded-b-xl">

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground max-w-50">
                  Drag to reorder sections.
                </p>
                <div className="w-48">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <PlusIcon className="h-4 w-4" /> Add Section
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      {AVAILABLE_SECTIONS.filter(s => !sections.some(sec => sec.sectionKey === s.key)).map(s => (
                        <DropdownMenuItem key={s.key} onSelect={() => handleAddSection(s.key)}>
                          {s.label}
                        </DropdownMenuItem>
                      ))}
                      {AVAILABLE_SECTIONS.filter(s => !sections.some(sec => sec.sectionKey === s.key)).length === 0 && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                          All sections added
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                          isDraggable={section.sectionKey !== "footer"}
                          isDeletable={section.sectionKey !== "footer"}
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
