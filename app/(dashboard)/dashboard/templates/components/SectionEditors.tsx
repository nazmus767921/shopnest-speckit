"use client"

import React from "react"
import { Input } from "@/components/ui/primitives/Input"
import { FormLabel } from "@/components/ui/primitives/FormLabel"
import { Select } from "@/components/ui/primitives/Select"
import { 
  HeroContent, 
  AnnouncementBarContent, 
  CategoryShowcaseContent, 
  AboutContent 
} from "@/lib/storefront-sections/types"

export function HeroEditor({ content, onChange }: { content: HeroContent, onChange: (c: HeroContent) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Title</FormLabel>
        <Input 
          value={content.title || ""}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Hero Title"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Subtitle</FormLabel>
        <Input 
          value={content.subtitle || ""}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          placeholder="Hero Subtitle"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Button Text</FormLabel>
        <Input 
          value={content.buttonText || ""}
          onChange={(e) => onChange({ ...content, buttonText: e.target.value })}
          placeholder="e.g. Shop Now"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Button Link</FormLabel>
        <Input 
          value={content.buttonLink || ""}
          onChange={(e) => onChange({ ...content, buttonLink: e.target.value })}
          placeholder="/products"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Image URL</FormLabel>
        <Input 
          value={content.imageUrl || ""}
          onChange={(e) => onChange({ ...content, imageUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
    </div>
  )
}

export function AnnouncementBarEditor({ content, onChange }: { content: AnnouncementBarContent, onChange: (c: AnnouncementBarContent) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Announcement Text</FormLabel>
        <Input 
          value={content.text || ""}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
          placeholder="Free shipping!"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <FormLabel>Background Color</FormLabel>
          <div className="flex gap-2 items-center">
            <input 
              type="color" 
              value={content.backgroundColor || "#000000"} 
              onChange={(e) => onChange({ ...content, backgroundColor: e.target.value })}
              className="w-10 h-10 p-1 rounded bg-transparent"
            />
            <Input 
              value={content.backgroundColor || "#000000"}
              onChange={(e) => onChange({ ...content, backgroundColor: e.target.value })}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <FormLabel>Text Color</FormLabel>
          <div className="flex gap-2 items-center">
            <input 
              type="color" 
              value={content.textColor || "#ffffff"} 
              onChange={(e) => onChange({ ...content, textColor: e.target.value })}
              className="w-10 h-10 p-1 rounded bg-transparent"
            />
            <Input 
              value={content.textColor || "#ffffff"}
              onChange={(e) => onChange({ ...content, textColor: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function CategoryShowcaseEditor({ content, onChange }: { content: CategoryShowcaseContent, onChange: (c: CategoryShowcaseContent) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Title</FormLabel>
        <Input 
          value={content.title || ""}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Shop by Category"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Layout</FormLabel>
        <select
          value={content.layout || "grid"}
          onChange={(e) => onChange({ ...content, layout: e.target.value as "grid" | "mosaic" })}
          className="h-10 px-3 bg-canvas-cream/40 border-hairline-light rounded-lg border outline-none focus:border-ink"
        >
          <option value="grid">Grid</option>
          <option value="mosaic">Mosaic</option>
        </select>
      </div>
      <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-micro text-zinc-500">
        Note: Selecting specific categories is not yet implemented in this editor. It will display all active categories by default.
      </div>
    </div>
  )
}

export function AboutEditor({ content, onChange }: { content: AboutContent, onChange: (c: AboutContent) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Title</FormLabel>
        <Input 
          value={content.title || ""}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="About Us"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Description</FormLabel>
        <textarea
          value={content.description || ""}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          placeholder="Our story..."
          className="min-h-24 p-3 bg-canvas-cream/40 border border-hairline-light rounded-lg text-body-md text-ink outline-none focus:ring-1 focus:ring-ink"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Image URL</FormLabel>
        <Input 
          value={content.imageUrl || ""}
          onChange={(e) => onChange({ ...content, imageUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Button Text</FormLabel>
        <Input 
          value={content.buttonText || ""}
          onChange={(e) => onChange({ ...content, buttonText: e.target.value })}
          placeholder="Read More"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Button Link</FormLabel>
        <Input 
          value={content.buttonLink || ""}
          onChange={(e) => onChange({ ...content, buttonLink: e.target.value })}
          placeholder="/about"
        />
      </div>
    </div>
  )
}
