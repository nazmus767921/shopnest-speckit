"use client"

import React, { useState } from "react"
import { LayoutTemplate, Edit2, CheckCircle2, AlertCircle, X, Check, Star } from "lucide-react"
import { Button } from "@/components/ui/primitives/Button"
import { Input } from "@/components/ui/primitives/Input"
import { FormLabel } from "@/components/ui/primitives/FormLabel"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/layout/Card"
import { Badge } from "@/components/ui/primitives/Badge"
import { toast } from "@/components/ui/feedback/Toast"
import { updateTemplateAction, toggleTemplateActiveAction } from "@/app/actions/admin"
import { useRouter } from "next/navigation"

interface Template {
  id: string
  slug: string
  name: string
  description: string | null
  previewImageUrl: string | null
  businessTypes: string[]
  allowedTiers: string[]
  isActive: boolean
  isDefault: boolean
  sortOrder: number
}

interface Props {
  initialTemplates: Template[]
}

const AVAILABLE_TIERS = ["starter", "growth", "pro"]
const COMMON_BUSINESS_TYPES = ["general", "clothing", "electronics", "beauty", "food", "accessories", "shoes"]

export function TemplatesDashboardClient({ initialTemplates }: Props) {
  const router = useRouter()
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit form states
  const [formName, setFormName] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formUrl, setFormUrl] = useState("")
  const [formTiers, setFormTiers] = useState<string[]>([])
  const [formBizTypes, setFormBizTypes] = useState<string[]>([])
  const [formActive, setFormActive] = useState(false)
  const [formDefault, setFormDefault] = useState(false)

  const openEditModal = (tpl: Template) => {
    setEditingTemplate(tpl)
    setFormName(tpl.name)
    setFormDesc(tpl.description || "")
    setFormUrl(tpl.previewImageUrl || "")
    setFormTiers(tpl.allowedTiers)
    setFormBizTypes(tpl.businessTypes)
    setFormActive(tpl.isActive)
    setFormDefault(tpl.isDefault)
  }

  const closeEditModal = () => {
    setEditingTemplate(null)
  }

  const handleToggleTier = (tier: string) => {
    setFormTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    )
  }

  const handleToggleBizType = (type: string) => {
    setFormBizTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTemplate) return

    if (formTiers.length === 0) {
      toast.error("At least one subscription tier must be allowed.")
      return
    }

    if (formDefault && !formActive) {
      toast.error("Default template must be active.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await updateTemplateAction({
        id: editingTemplate.id,
        name: formName,
        description: formDesc,
        previewImageUrl: formUrl,
        businessTypes: formBizTypes,
        allowedTiers: formTiers,
        isActive: formActive,
        isDefault: formDefault,
      })

      if (res.success) {
        toast.success("Template updated successfully.")
        closeEditModal()
        router.refresh()
      } else {
        toast.error(res.error || "Failed to update template.")
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (tpl: Template) => {
    try {
      const res = await toggleTemplateActiveAction({
        id: tpl.id,
        isActive: !tpl.isActive,
      })
      if (res.success) {
        toast.success(`Template ${tpl.isActive ? "deactivated" : "activated"} successfully.`)
        router.refresh()
      } else {
        toast.error(res.error || "Failed to update status.")
      }
    } catch (err: any) {
      toast.error("Failed to toggle status.")
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-fade-in py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-hairline-light">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
            Storefront Templates
          </h1>
          <p className="text-caption text-shade-50 font-light mt-1">
            Manage global storefront layouts, tier access permissions, and default templates.
          </p>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {initialTemplates.map((tpl) => (
          <Card key={tpl.id} variant="default" className="overflow-hidden flex flex-col justify-between rounded-2xl border border-hairline-light">
            <div className="relative aspect-[3/2] w-full bg-zinc-50 border-b border-hairline-light overflow-hidden">
              <img
                src={tpl.slug === "fashion" ? "/images/templates/fashion-thumbnail.png" : "/images/templates/general-thumbnail.png"}
                alt={tpl.name}
                className="w-full h-full object-cover"
              />
              {tpl.isDefault && (
                <div className="absolute top-4 left-4 bg-emerald-500 text-white text-micro font-bold py-1 px-3 rounded-full flex items-center gap-1.5 shadow-md uppercase tracking-wider">
                  <Star className="h-3 w-3 fill-white" />
                  <span>Default Template</span>
                </div>
              )}
            </div>

            <CardContent className="p-6 flex flex-col gap-4 grow">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-body-lg font-bold text-ink">{tpl.name}</h3>
                  <Badge variant={tpl.isActive ? "mint" : "shade"} className="rounded-full uppercase tracking-wider">
                    {tpl.isActive ? "Active" : "Draft"}
                  </Badge>
                </div>
                <p className="text-caption text-shade-50 mt-1.5 leading-relaxed font-light">{tpl.description}</p>
              </div>

              {/* Badges Stack */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider mr-1">Tiers:</span>
                  {tpl.allowedTiers.map((t) => (
                    <span
                      key={t}
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        t === "starter"
                          ? "bg-zinc-100 text-zinc-600 border border-zinc-200"
                          : t === "growth"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider mr-1">Business Mappings:</span>
                  {tpl.businessTypes.map((b) => (
                    <span key={b} className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded-lg font-medium lowercase">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-hairline-light">
                <Button
                  onClick={() => openEditModal(tpl)}
                  variant="outline"
                  className="flex items-center gap-1.5 rounded-full grow cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Metadata</span>
                </Button>
                <Button
                  onClick={() => handleToggleActive(tpl)}
                  variant={tpl.isActive ? "outline" : "primary"}
                  disabled={tpl.isDefault}
                  className="rounded-full grow cursor-pointer"
                >
                  {tpl.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Form Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl flex flex-col gap-5 border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-hairline-light">
              <h3 className="font-display text-heading-md font-bold text-ink">Edit Template: {editingTemplate.name}</h3>
              <button onClick={closeEditModal} className="p-1 hover:bg-zinc-100 rounded-full cursor-pointer">
                <X className="h-5 w-5 text-shade-50" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <FormLabel htmlFor="tpl-name">Template Name</FormLabel>
                <Input
                  id="tpl-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="Template Name"
                  className="rounded-lg border-hairline-light focus:border-ink"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <FormLabel htmlFor="tpl-desc">Description</FormLabel>
                <textarea
                  id="tpl-desc"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  placeholder="Template description..."
                  className="w-full bg-canvas-cream/20 text-ink border border-hairline-light focus:border-ink rounded-lg p-3 outline-none text-body-md"
                />
              </div>

              {/* Tiers Checkboxes */}
              <div className="flex flex-col gap-2">
                <span className="text-caption font-semibold text-ink">Allowed Subscription Tiers</span>
                <div className="flex items-center gap-4">
                  {AVAILABLE_TIERS.map((tier) => (
                    <label key={tier} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formTiers.includes(tier)}
                        onChange={() => handleToggleTier(tier)}
                        className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 cursor-pointer"
                      />
                      <span className="text-body-md capitalize text-zinc-700">{tier}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Business Types Multi-Select */}
              <div className="flex flex-col gap-2">
                <span className="text-caption font-semibold text-ink">Target Business Types</span>
                <div className="flex flex-wrap gap-2">
                  {COMMON_BUSINESS_TYPES.map((type) => {
                    const isSelected = formBizTypes.includes(type)
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => handleToggleBizType(type)}
                        className={`text-[11px] px-3 py-1.5 rounded-full font-medium transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-zinc-950 text-white font-semibold"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                      >
                        {type}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Active & Default Switches */}
              <div className="flex items-center gap-8 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    disabled={formDefault}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-body-md text-zinc-700">Active</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formDefault}
                    onChange={(e) => {
                      setFormDefault(e.target.checked)
                      if (e.target.checked) setFormActive(true) // default must be active
                    }}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 cursor-pointer"
                  />
                  <span className="text-body-md text-zinc-700 flex items-center gap-1">
                    <span>Default Template</span>
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-hairline-light">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditModal}
                  disabled={isSubmitting}
                  className="rounded-full cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-ink text-white cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
