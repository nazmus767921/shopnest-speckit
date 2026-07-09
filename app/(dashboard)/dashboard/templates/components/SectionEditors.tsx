"use client"

import React from "react"
import { Input } from "@/components/ui/primitives/Input"
import { FormLabel } from "@/components/ui/primitives/FormLabel"
import { Select } from "@/components/ui/primitives/Select"
import { Textarea } from "@/components/ui/primitives/Textarea"
import { 
  HeroContent, 
  AnnouncementBarContent, 
  CategoryShowcaseContent, 
  AboutContent,
  ProductGridContent,
  FaqContent,
  FooterContent
} from "@/lib/storefront-sections/types"
import { Button } from "@/components/ui/primitives/Button"
import { Trash2, Plus } from "lucide-react"

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
        <Select
          options={[{label: "Grid", value: "grid"}, {label: "Mosaic", value: "mosaic"}]}
          value={{label: content.layout === "mosaic" ? "Mosaic" : "Grid", value: content.layout || "grid"}}
          onChange={(opt) => onChange({ ...content, layout: (opt as any).value as "grid" | "mosaic" })}
        />
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
        <Textarea
          value={content.description || ""}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          placeholder="Our story..."
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

export function ProductGridEditor({ content, onChange }: { content: ProductGridContent, onChange: (c: ProductGridContent) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Title</FormLabel>
        <Input 
          value={content.title || ""}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Featured Products"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Grid Type</FormLabel>
        <Select
          options={[
            {label: "Featured", value: "featured"},
            {label: "New Arrivals", value: "new_arrivals"},
            {label: "Exclusive", value: "exclusive"},
            {label: "Manual Selection", value: "manual_selection"}
          ]}
          value={{
            label: content.gridType === "new_arrivals" ? "New Arrivals" :
                   content.gridType === "exclusive" ? "Exclusive" :
                   content.gridType === "manual_selection" ? "Manual Selection" : "Featured",
            value: content.gridType || "featured"
          }}
          onChange={(opt) => onChange({ ...content, gridType: (opt as any).value })}
        />
      </div>
      <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-micro text-zinc-500">
        Note: The products displayed are based on the product promotion type set in your inventory.
      </div>
    </div>
  )
}

export function FaqEditor({ content, onChange }: { content: FaqContent, onChange: (c: FaqContent) => void }) {
  const items = content.items || []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Title</FormLabel>
        <Input 
          value={content.title || ""}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Frequently Asked Questions"
        />
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <FormLabel>Questions & Answers</FormLabel>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (items.length < 8) {
                onChange({ ...content, items: [...items, { question: "", answer: "" }] })
              }
            }}
            disabled={items.length >= 8}
            className="h-8 rounded-full"
          >
            <Plus className="w-4 h-4 mr-1" /> Add FAQ
          </Button>
        </div>
        
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-3 items-start border border-hairline-light p-4 rounded-xl bg-white">
            <div className="flex flex-col gap-3 flex-1">
              <Input 
                value={item.question}
                onChange={(e) => {
                  const newItems = [...items]
                  newItems[idx].question = e.target.value
                  onChange({ ...content, items: newItems })
                }}
                placeholder="Question"
              />
              <Textarea 
                value={item.answer}
                onChange={(e) => {
                  const newItems = [...items]
                  newItems[idx].answer = e.target.value
                  onChange({ ...content, items: newItems })
                }}
                placeholder="Answer"
                rows={2}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const newItems = [...items]
                newItems.splice(idx, 1)
                onChange({ ...content, items: newItems })
              }}
              className="text-zinc-400 hover:text-red-500 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-zinc-500 italic">No FAQs added yet.</p>
        )}
      </div>
    </div>
  )
}

export function FooterEditor({ content, onChange }: { content: FooterContent, onChange: (c: FooterContent) => void }) {
  const links = content.socialLinks || {}
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Store Description</FormLabel>
        <Textarea 
          value={content.storeDescription || ""}
          onChange={(e) => onChange({ ...content, storeDescription: e.target.value })}
          placeholder="Brief description for the footer..."
          rows={2}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Store Address</FormLabel>
        <Textarea 
          value={content.storeAddress || ""}
          onChange={(e) => onChange({ ...content, storeAddress: e.target.value })}
          placeholder="123 Main St..."
          rows={2}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Copyright Text</FormLabel>
        <Input 
          value={content.copyrightText || ""}
          onChange={(e) => onChange({ ...content, copyrightText: e.target.value })}
          placeholder="© 2026 StoreName"
        />
      </div>
      
      <div className="pt-2">
        <FormLabel className="mb-2 block">Social Links</FormLabel>
        <div className="grid grid-cols-1 gap-3">
          <Input 
            value={links.facebook || ""}
            onChange={(e) => onChange({ ...content, socialLinks: { ...links, facebook: e.target.value } })}
            placeholder="Facebook URL"
          />
          <Input 
            value={links.instagram || ""}
            onChange={(e) => onChange({ ...content, socialLinks: { ...links, instagram: e.target.value } })}
            placeholder="Instagram URL"
          />
          <Input 
            value={links.whatsapp || ""}
            onChange={(e) => onChange({ ...content, socialLinks: { ...links, whatsapp: e.target.value } })}
            placeholder="WhatsApp Number"
          />
          <Input 
            value={links.tiktok || ""}
            onChange={(e) => onChange({ ...content, socialLinks: { ...links, tiktok: e.target.value } })}
            placeholder="TikTok URL"
          />
        </div>
      </div>
    </div>
  )
}
