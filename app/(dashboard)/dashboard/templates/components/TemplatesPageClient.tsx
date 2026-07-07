"use client"

import React, { useState, useEffect } from "react"
import { TemplatePicker } from "./TemplatePicker"
import { applyTemplateAction } from "@/app/actions/settings"
import { saveStorefrontSectionsAction, seedDefaultSectionsAction } from "@/app/actions/storefront-sections"
import { toast } from "@/components/ui/feedback/Toast"
import { Button } from "@/components/ui/primitives/Button"
import { Save, ChevronDown, ChevronUp, GripVertical, Trash2, Plus } from "lucide-react"
import { 
  HeroEditor, 
  AnnouncementBarEditor, 
  CategoryShowcaseEditor, 
  AboutEditor 
} from "./SectionEditors"
import { StorefrontSection } from "@/lib/storefront-sections/types"
import { defaultStorefrontSections } from "@/lib/storefront-sections/defaults"

interface TemplatesPageClientProps {
  templates: any[]
  currentTemplate: string
  initialSections: StorefrontSection[]
}

export function TemplatesPageClient({ templates, currentTemplate, initialSections }: TemplatesPageClientProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate)
  const [sections, setSections] = useState<any[]>(initialSections)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  useEffect(() => {
    if (initialSections.length === 0) {
      // If no sections, offer to seed defaults
      handleSeedDefaults()
    }
  }, [initialSections])

  const handleSeedDefaults = async () => {
    setIsSaving(true)
    const res = await seedDefaultSectionsAction()
    if (res.success && res.seeded) {
      // Re-hydrate state from defaults (in real app, we might reload or fetch)
      setSections(defaultStorefrontSections)
      toast.success("Default sections loaded.")
    } else if (res.success) {
      // Already has sections
    } else {
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
    // Update sortOrder based on current array index
    const orderedSections = sections.map((sec, index) => ({
      ...sec,
      sortOrder: index
    }))

    const res = await saveStorefrontSectionsAction(orderedSections)
    if (res.success) {
      toast.success("Homepage sections saved successfully.")
      setSections(orderedSections)
    } else {
      toast.error(res.error || "Failed to save sections.")
    }
    setIsSaving(false)
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

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newSections = [...sections]
      const temp = newSections[index]
      newSections[index] = newSections[index - 1]
      newSections[index - 1] = temp
      setSections(newSections)
    } else if (direction === 'down' && index < sections.length - 1) {
      const newSections = [...sections]
      const temp = newSections[index]
      newSections[index] = newSections[index + 1]
      newSections[index + 1] = temp
      setSections(newSections)
    }
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      {/* Template Picker Section */}
      <section className="flex flex-col gap-4">
        <h2 className="text-heading-sm font-bold text-ink border-b border-hairline-light pb-2">Active Theme</h2>
        <TemplatePicker 
          templates={templates} 
          loading={false} 
          selectedTemplate={selectedTemplate} 
          onSelect={handleApplyTemplate} 
        />
      </section>

      {/* Homepage Sections Editor */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-hairline-light pb-2">
          <h2 className="text-heading-sm font-bold text-ink">Homepage Sections Editor</h2>
          <Button 
            onClick={handleSaveSections} 
            disabled={isSaving}
            className="flex items-center gap-2 rounded-full"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Sections"}
          </Button>
        </div>

        <div className="bg-canvas-cream/20 border border-hairline-light p-6 rounded-2xl flex flex-col gap-4">
          <p className="text-sm text-shade-50">
            Customize the content for your selected template. Sections will be rendered in the order shown below.
          </p>

          <div className="flex flex-col gap-3">
            {sections.map((section, index) => {
              const isExpanded = expandedSection === index.toString()
              return (
                <div key={index} className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                  {/* Accordion Header */}
                  <div className="flex items-center justify-between p-4 bg-zinc-50 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <button type="button" onClick={() => moveSection(index, 'up')} disabled={index === 0} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                        <button type="button" onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                      </div>
                      <span className="font-semibold text-body-md text-ink capitalize">
                        {section.sectionKey.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-600">
                        <input 
                          type="checkbox" 
                          checked={section.isVisible} 
                          onChange={() => toggleSectionVisibility(index)} 
                          className="rounded text-primary focus:ring-primary"
                        />
                        Visible
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setExpandedSection(isExpanded ? null : index.toString())}
                        className="p-1 text-zinc-500 hover:bg-zinc-200 rounded"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Accordion Body */}
                  {isExpanded && (
                    <div className="p-6">
                      {renderEditorForSection(section, (newContent) => updateSectionContent(index, newContent))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
