"use client"

import React from "react"

export function TemplatesSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20 items-start animate-pulse">
      {/* Left Pane: Controls Skeleton */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Active Theme Accordion */}
        <div className="border border-border rounded-xl bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-3 w-40 bg-muted rounded" />
            </div>
          </div>
        </div>

        {/* Theme Settings Accordion */}
        <div className="border border-border rounded-xl bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          </div>
        </div>

        {/* Sections Accordion */}
        <div className="border border-border rounded-xl bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-36 bg-muted rounded" />
                <div className="h-3 w-28 bg-muted rounded" />
              </div>
            </div>
            <div className="h-9 w-24 bg-muted rounded-lg" />
          </div>

          {/* Section Items */}
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
                <div className="w-5 h-5 bg-muted rounded" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-muted rounded mb-1" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-muted rounded" />
                  <div className="w-8 h-8 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Pane: Preview Canvas Skeleton */}
      <div className="lg:col-span-7">
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          {/* Browser Chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
              <div className="w-3 h-3 rounded-full bg-green-400/50" />
            </div>
            <div className="flex-1 mx-4">
              <div className="h-6 bg-muted rounded-md w-full" />
            </div>
          </div>

          {/* Preview Content */}
          <div className="aspect-[4/3] bg-muted/30 p-6 flex flex-col gap-4">
            {/* Hero Section Skeleton */}
            <div className="h-32 bg-muted rounded-lg" />
            
            {/* Content Blocks */}
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-muted rounded-lg" />
              <div className="h-20 bg-muted rounded-lg" />
              <div className="h-20 bg-muted rounded-lg" />
            </div>

            {/* Text Lines */}
            <div className="flex flex-col gap-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>

            {/* Product Grid Skeleton */}
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="aspect-square bg-muted rounded-lg" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
