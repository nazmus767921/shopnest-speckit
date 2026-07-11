"use client"

import React from "react"
import { LockIcon } from "@/lib/icons";

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
        <div className="h-64 bg-muted/50 rounded-xl animate-pulse border border-border" />
        <div className="h-64 bg-muted/50 rounded-xl animate-pulse border border-border" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2 text-foreground">
      {templates.map((tpl) => {
        const isActive = selectedTemplate === tpl.slug
        return (
          <div
            key={tpl.slug}
            className={cn(
              "border rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-350 bg-card",
              isActive
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-muted-foreground/30"
            )}
          >
            {/* Thumbnail */}
            <div className="relative aspect-[3/2] w-full bg-muted border-b border-border overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tpl.slug === "fashion" ? "/images/templates/fashion-thumbnail.png" : "/images/templates/general-thumbnail.png"}
                alt={`${tpl.name} Preview`}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              {tpl.isLocked && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white gap-2 p-4 text-center">
                  <LockIcon className="h-8 w-8 text-amber-400" />
                  <span className="font-semibold text-sm uppercase tracking-wider text-amber-400">Locked</span>
                  <span className="text-xs opacity-90 max-w-[200px]">
                    Requires Growth or Pro subscription plan.
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-5 flex flex-col gap-4 grow">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-foreground">{tpl.name}</h4>
                  <div className="flex items-center gap-1.5">
                    {tpl.allowedTiers.map((t: string) => (
                      <span
                        key={t}
                        className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                          t === "starter"
                            ? "bg-muted text-muted-foreground border-border"
                            : t === "growth"
                            ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20"
                            : "bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border-indigo-500/20"
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-light mt-1">{tpl.description}</p>
              </div>

              {/* Action */}
              <div className="mt-auto pt-2">
                {isActive ? (
                  <Button
                    type="button"
                    disabled
                    variant="outline"
                    className="w-full rounded-md font-semibold border-emerald-500/30 text-emerald-600 bg-emerald-500/5 cursor-default py-2"
                  >
                    Active Template
                  </Button>
                ) : tpl.isLocked ? (
                  <Button
                    type="button"
                    disabled
                    variant="outline"
                    className="w-full rounded-md font-semibold border-border text-muted-foreground/50 bg-muted/30 cursor-not-allowed py-2"
                  >
                    Upgrade to Apply
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => onSelect(tpl.slug)}
                    className="w-full rounded-md font-semibold py-2"
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
