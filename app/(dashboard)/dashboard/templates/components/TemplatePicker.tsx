"use client"

import React from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/primitives/Button"

interface Template {
  id: string
  slug: string
  name: string
  description: string
  isLocked: boolean
  allowedTiers: string[]
}

interface TemplatePickerProps {
  templates: Template[]
  loading: boolean
  selectedTemplate: string
  onSelect: (slug: string) => void
}

export function TemplatePicker({ templates, loading, selectedTemplate, onSelect }: TemplatePickerProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
        <div className="h-64 bg-canvas-cream/50 rounded-2xl animate-pulse border border-hairline-light" />
        <div className="h-64 bg-canvas-cream/50 rounded-2xl animate-pulse border border-hairline-light" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
      {templates.map((tpl) => {
        const isActive = selectedTemplate === tpl.slug
        return (
          <div
            key={tpl.slug}
            className={`border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 bg-white ${
              isActive
                ? "border-emerald-500 ring-2 ring-emerald-500/20"
                : "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
            }`}
          >
            {/* Thumbnail */}
            <div className="relative aspect-[3/2] w-full bg-zinc-50 border-b border-zinc-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tpl.slug === "fashion" ? "/images/templates/fashion-thumbnail.png" : "/images/templates/general-thumbnail.png"}
                alt={`${tpl.name} Preview`}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              {tpl.isLocked && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white gap-2 p-4 text-center">
                  <Lock className="h-8 w-8 text-amber-400" />
                  <span className="font-semibold text-body-md uppercase tracking-wider text-amber-400">Locked</span>
                  <span className="text-micro opacity-90 max-w-[200px]">
                    Requires Growth or Pro subscription plan.
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-5 flex flex-col gap-4 grow">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-body-lg font-bold text-zinc-900">{tpl.name}</h4>
                  <div className="flex items-center gap-1.5">
                    {tpl.allowedTiers.map((t: string) => (
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
                </div>
                <p className="text-caption text-zinc-500 font-light mt-1">{tpl.description}</p>
              </div>

              {/* Action */}
              <div className="mt-auto pt-2">
                {isActive ? (
                  <Button
                    type="button"
                    disabled
                    className="w-full bg-emerald-500 text-white rounded-full font-semibold border-none cursor-default py-2"
                  >
                    Active Template
                  </Button>
                ) : tpl.isLocked ? (
                  <Button
                    type="button"
                    disabled
                    className="w-full bg-zinc-100 text-zinc-400 rounded-full font-semibold border border-zinc-200 cursor-not-allowed py-2"
                  >
                    Upgrade to Apply
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => onSelect(tpl.slug)}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-semibold py-2"
                  >
                    Apply Design
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
