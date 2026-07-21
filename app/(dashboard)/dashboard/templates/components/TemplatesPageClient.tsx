"use client"

import React, { useState, useEffect } from "react"
import { TemplatePicker } from "./TemplatePicker"
import { applyTemplateAction, updateThemeSettingsAction } from "@/app/actions/settings"
import { saveStorefrontSectionsAction, seedDefaultSectionsAction } from "@/app/actions/storefront-sections"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { SaveIcon, ChevronDownIcon, ChevronRightIcon, LayoutTemplateIcon, PaletteIcon, LayoutListIcon, LockIcon, EyeIcon, EyeOffIcon } from "@/lib/icons";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  HeroEditor,
  AnnouncementBarEditor,
  CategoryShowcaseEditor,
  BrandStoryEditor,
  FeaturedProductsEditor,
  PromoBannerEditor,
  TestimonialsEditor,
  NewsletterEditor,
  FaqEditor,
  FooterEditor
} from "./SectionEditors"
import { StorefrontSection } from "@/lib/storefront-sections/types"
import { defaultStorefrontSections } from "@/lib/storefront-sections/defaults"
import { SECTION_SORT_ORDER, isCoreSection, SectionKey } from "@/lib/storefront-sections/section-catalog"
import { PreviewPane } from "./PreviewPane"
import { UnsavedChangesBar } from "./UnsavedChangesBar"
import { fontPairs } from "@/lib/storefront/theme/fonts"

interface TemplatesPageClientProps {
  templates: any[]
  currentTemplate: string
  initialSections: StorefrontSection[]
  initialThemeSettings?: any
  merchantSubdomain: string
}

export function TemplatesPageClient({ templates, currentTemplate, initialSections, initialThemeSettings, merchantSubdomain }: TemplatesPageClientProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate)
  
  // Sort sections by catalog order
  const sortSections = (secs: StorefrontSection[]) => {
    return [...secs].sort((a, b) => {
      const orderA = SECTION_SORT_ORDER[a.sectionKey as SectionKey] ?? 99
      const orderB = SECTION_SORT_ORDER[b.sectionKey as SectionKey] ?? 99
      return orderA - orderB
    })
  }

  const [baselineSections, setBaselineSections] = useState<StorefrontSection[]>(sortSections(initialSections))
  const [sections, setSections] = useState<StorefrontSection[]>(sortSections(initialSections))

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

  const [activeAccordion, setActiveAccordion] = useState<string>("sections")
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [isPanelExpanded, setIsPanelExpanded] = useState(true)

  useEffect(() => {
    if (initialSections.length === 0) {
      handleSeedDefaults()
    }
  }, [initialSections])

  const handleSeedDefaults = async () => {
    setIsSaving(true)
    const res = await seedDefaultSectionsAction()
    if (res.success && res.seeded) {
      const sorted = sortSections(defaultStorefrontSections as StorefrontSection[])
      setSections(sorted)
      setBaselineSections(sorted)
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
    const res = await saveStorefrontSectionsAction(sections)
    if (res.success) {
      toast.success("Homepage sections saved successfully.")
      setBaselineSections(sections)
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

  const handleSaveAll = async () => {
    setIsSaving(true)
    setIsSavingTheme(true)
    const promises = []
    
    if (hasUnsavedSections) {
      promises.push(saveStorefrontSectionsAction(sections).then(res => {
        if (res.success) {
          setBaselineSections(sections)
        } else {
          toast.error(res.error || "Failed to save sections.")
        }
      }))
    }
    
    if (hasUnsavedTheme) {
      promises.push(updateThemeSettingsAction(themeSettings).then(res => {
        if (res.success) {
          setBaselineTheme(themeSettings)
        } else {
          toast.error(res.error || "Failed to save theme settings.")
        }
      }))
    }
    
    await Promise.all(promises)
    toast.success("Changes saved successfully.")
    setIsSaving(false)
    setIsSavingTheme(false)
  }

  const handleDiscardAll = () => {
    setSections(baselineSections)
    setThemeSettings(baselineTheme)
  }

  const renderEditorForSection = (section: StorefrontSection, onChange: (newContent: any) => void) => {
    switch (section.sectionKey) {
      case "hero":
        return <HeroEditor content={section.content as any} onChange={onChange} />
      case "announcement_bar":
        return <AnnouncementBarEditor content={section.content as any} onChange={onChange} />
      case "category_showcase":
        return <CategoryShowcaseEditor content={section.content as any} onChange={onChange} />
      case "brand_story":
        return <BrandStoryEditor content={section.content as any} onChange={onChange} />
      case "featured_products":
        return <FeaturedProductsEditor content={section.content as any} onChange={onChange} />
      case "promo_banner":
        return <PromoBannerEditor content={section.content as any} onChange={onChange} />
      case "testimonials":
        return <TestimonialsEditor content={section.content as any} onChange={onChange} />
      case "newsletter":
        return <NewsletterEditor content={section.content as any} onChange={onChange} />
      case "faq":
        return <FaqEditor content={section.content as any} onChange={onChange} />
      case "footer":
        return <FooterEditor content={section.content as any} onChange={onChange} />
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

  const SECTION_LABELS: Record<string, string> = {
    hero: "Hero Banner",
    announcement_bar: "Announcement Bar",
    category_showcase: "Category Showcase",
    brand_story: "Brand Story",
    featured_products: "Featured Products",
    promo_banner: "Promotional Banner",
    testimonials: "Testimonials",
    newsletter: "Newsletter",
    faq: "FAQ Section",
    footer: "Footer"
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20 items-start text-foreground transition-all duration-300">

      {/* Left Pane: Controls */}
      <div className={`flex flex-col gap-6 transition-all duration-300 ${isPanelExpanded ? "lg:col-span-5 opacity-100" : "hidden opacity-0"}`}>

        {/* Accordion 1: Active Theme (Only show if multiple templates exist) */}
        {templates.length > 1 && (
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
        )}

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

                {/* Typography */}
                <div className="flex flex-col gap-4 md:col-span-2 border-t pt-6">
                  <h3 className="font-semibold text-sm">Typography</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-muted-foreground">Heading Font</label>
                      <Select
                        value={themeSettings.typography?.headingFont || "Inter"}
                        onValueChange={(val) => setThemeSettings({
                          ...themeSettings,
                          typography: { ...themeSettings.typography, headingFont: val }
                        })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Heading Font" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(new Set(fontPairs.map(fp => fp.headingFont))).map(font => (
                            <SelectItem key={`heading-${font}`} value={font}>
                              {font}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-muted-foreground">Body Font</label>
                      <Select
                        value={themeSettings.typography?.bodyFont || "Inter"}
                        onValueChange={(val) => setThemeSettings({
                          ...themeSettings,
                          typography: { ...themeSettings.typography, bodyFont: val }
                        })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Body Font" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(new Set(fontPairs.map(fp => fp.bodyFont))).map(font => (
                            <SelectItem key={`body-${font}`} value={font}>
                              {font}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
              <button onClick={() => setActiveAccordion(activeAccordion === 'sections' ? '' : 'sections')}>
                {activeAccordion === 'sections' ? <ChevronDownIcon className="w-5 h-5 text-muted-foreground" /> : <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {activeAccordion === 'sections' && (
            <div className="p-6 bg-muted/30 flex flex-col gap-6 rounded-b-xl">
              <div className="flex flex-col gap-3">
                {sections.map((section, index) => {
                  const id = section.id || section.sectionKey
                  const isExpanded = expandedSection === id
                  const isCore = isCoreSection(section.sectionKey)

                  return (
                    <div 
                      key={id}
                      className={`border border-border bg-card rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${!section.isVisible ? "opacity-75 grayscale-[0.2]" : ""}`}
                    >
                      <div className={`flex items-center justify-between p-4 ${isExpanded ? "border-b border-border bg-muted/30" : "hover:bg-muted/30"}`}>
                        <button
                          onClick={() => setExpandedSection(isExpanded ? null : id)}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          {isExpanded ? <ChevronDownIcon className="w-5 h-5 text-muted-foreground" /> : <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />}
                          <span className="font-semibold text-sm">
                            {SECTION_LABELS[section.sectionKey] || section.sectionKey}
                          </span>
                        </button>
                        
                        <div className="flex items-center gap-3 pl-3 border-l border-border ml-3">
                          {isCore ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded-full font-medium" title="This is a core section and cannot be hidden">
                              <LockIcon className="w-3.5 h-3.5" />
                              Required
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* If Switch doesn't exist, this will fallback, but we assume it does based on Shadcn */}
                              {typeof Switch !== 'undefined' ? (
                                <Switch 
                                  checked={section.isVisible} 
                                  onCheckedChange={() => toggleSectionVisibility(index)} 
                                />
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleSectionVisibility(index)
                                  }}
                                  className={`p-1.5 rounded-full ${section.isVisible ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                                >
                                  {section.isVisible ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="p-5 bg-background">
                          {renderEditorForSection(section, (newContent) => updateSectionContent(index, newContent))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Right Pane: Live Preview Canvas */}
      <div className={`${isPanelExpanded ? "lg:col-span-7" : "lg:col-span-12"} h-[calc(100vh-120px)] sticky top-6 transition-all duration-300`}>
        <PreviewPane
          sections={sections}
          themeSettings={themeSettings}
          merchantSubdomain={merchantSubdomain}
          expandedSectionKey={expandedSection}
          isPanelExpanded={isPanelExpanded}
          onTogglePanel={() => setIsPanelExpanded(!isPanelExpanded)}
        />
      </div>

      <UnsavedChangesBar 
        hasUnsavedChanges={hasUnsavedSections || hasUnsavedTheme} 
        isSaving={isSaving || isSavingTheme} 
        onSave={handleSaveAll} 
        onDiscard={handleDiscardAll} 
      />
    </div>
  )
}
