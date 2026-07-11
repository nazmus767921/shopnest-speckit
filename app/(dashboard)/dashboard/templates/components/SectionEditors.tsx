"use client"

import React from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label as FormLabel } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  HeroContent, 
  AnnouncementBarContent, 
  CategoryShowcaseContent, 
  AboutContent,
  ProductGridContent,
  FaqContent,
  FooterContent
} from "@/lib/storefront-sections/types"
import { Button } from "@/components/ui/button"
import { Trash2Icon, PlusIcon, InfoIcon } from "@/lib/icons";

export function HeroEditor({ content, onChange }: { content: HeroContent, onChange: (c: HeroContent) => void }) {
  return (
    <div className="flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Title</FormLabel>
        <Input 
          value={content.title || ""}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Hero Title"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Subtitle</FormLabel>
        <Input 
          value={content.subtitle || ""}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          placeholder="Hero Subtitle"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Button Text</FormLabel>
        <Input 
          value={content.buttonText || ""}
          onChange={(e) => onChange({ ...content, buttonText: e.target.value })}
          placeholder="e.g. Shop Now"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Button Link</FormLabel>
        <Input 
          value={content.buttonLink || ""}
          onChange={(e) => onChange({ ...content, buttonLink: e.target.value })}
          placeholder="/products"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Image URL</FormLabel>
        <Input 
          value={content.imageUrl || ""}
          onChange={(e) => onChange({ ...content, imageUrl: e.target.value })}
          placeholder="https://..."
          className="rounded-lg bg-background border-border"
        />
      </div>
    </div>
  )
}

export function AnnouncementBarEditor({ content, onChange }: { content: AnnouncementBarContent, onChange: (c: AnnouncementBarContent) => void }) {
  return (
    <div className="flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Announcement Text</FormLabel>
        <Input 
          value={content.text || ""}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
          placeholder="Free shipping!"
          className="rounded-lg bg-background border-border"
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
              className="w-10 h-10 p-1 rounded-lg border border-border cursor-pointer bg-background"
            />
            <Input 
              value={content.backgroundColor || "#000000"}
              onChange={(e) => onChange({ ...content, backgroundColor: e.target.value })}
              className="rounded-lg bg-background border-border"
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
              className="w-10 h-10 p-1 rounded-lg border border-border cursor-pointer bg-background"
            />
            <Input 
              value={content.textColor || "#ffffff"}
              onChange={(e) => onChange({ ...content, textColor: e.target.value })}
              className="rounded-lg bg-background border-border"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function CategoryShowcaseEditor({ content, onChange }: { content: CategoryShowcaseContent, onChange: (c: CategoryShowcaseContent) => void }) {
  return (
    <div className="flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Title</FormLabel>
        <Input 
          value={content.title || ""}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Shop by Category"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Layout</FormLabel>
        <Select
          value={content.layout || "grid"}
          onValueChange={(val) => onChange({ ...content, layout: val as "grid" | "mosaic" })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="mosaic">Mosaic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="p-3 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground">
        Note: Selecting specific categories is not yet implemented in this editor. It will display all active categories by default.
      </div>
    </div>
  )
}

export function AboutEditor({ content, onChange }: { content: AboutContent, onChange: (c: AboutContent) => void }) {
  return (
    <div className="flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Title</FormLabel>
        <Input 
          value={content.title || ""}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="About Us"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Description</FormLabel>
        <Textarea
          value={content.description || ""}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          placeholder="Our story..."
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Image URL</FormLabel>
        <Input 
          value={content.imageUrl || ""}
          onChange={(e) => onChange({ ...content, imageUrl: e.target.value })}
          placeholder="https://..."
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Button Text</FormLabel>
        <Input 
          value={content.buttonText || ""}
          onChange={(e) => onChange({ ...content, buttonText: e.target.value })}
          placeholder="Read More"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Button Link</FormLabel>
        <Input 
          value={content.buttonLink || ""}
          onChange={(e) => onChange({ ...content, buttonLink: e.target.value })}
          placeholder="/about"
          className="rounded-lg bg-background border-border"
        />
      </div>
    </div>
  )
}

export function ProductGridEditor({ content, onChange }: { content: ProductGridContent, onChange: (c: ProductGridContent) => void }) {
  return (
    <div className="flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Title</FormLabel>
        <Input 
          value={content.title || ""}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Featured Products"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Grid Type</FormLabel>
        <Select
          value={content.gridType || "featured"}
          onValueChange={(val) => onChange({ ...content, gridType: val as any })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Grid Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="new_arrivals">New Arrivals</SelectItem>
            <SelectItem value="exclusive">Exclusive</SelectItem>
            <SelectItem value="manual_selection">Manual Selection</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="p-3 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground">
        Note: The products displayed are based on the product promotion type set in your inventory.
      </div>
    </div>
  )
}

export function FaqEditor({ content, onChange }: { content: FaqContent, onChange: (c: FaqContent) => void }) {
  const items = content.items || []

  return (
    <div className="flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Title</FormLabel>
        <Input 
          value={content.title || ""}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Frequently Asked Questions"
          className="rounded-lg bg-background border-border"
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
            <PlusIcon className="w-4 h-4 mr-1" /> Add FAQ
          </Button>
        </div>
        
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-3 items-start border border-border p-4 rounded-xl bg-card">
            <div className="flex flex-col gap-3 flex-1">
              <Input 
                value={item.question}
                onChange={(e) => {
                  const newItems = [...items]
                  newItems[idx].question = e.target.value
                  onChange({ ...content, items: newItems })
                }}
                placeholder="Question"
                className="rounded-lg bg-background border-border"
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
                className="rounded-lg bg-background border-border"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const newItems = [...items]
                newItems.splice(idx, 1)
                onChange({ ...content, items: newItems })
              }}
              className="text-muted-foreground/60 hover:text-destructive p-2 cursor-pointer transition-colors"
            >
              <Trash2Icon className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No FAQs added yet.</p>
        )}
      </div>
    </div>
  )
}

export function FooterEditor({ content, onChange }: { content: FooterContent, onChange: (c: FooterContent) => void }) {
  const links = content.socialLinks || {}
  return (
    <div className="flex flex-col gap-4 text-foreground">
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg text-sm">
        <InfoIcon className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
        <span className="text-blue-600 dark:text-blue-400">
          Footer navigation links are managed in the{' '}
          <Link href="/dashboard/navigation" className="font-medium underline hover:text-blue-700 dark:hover:text-blue-300">
            Navigation page
          </Link>
          .
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Store Description</FormLabel>
        <Textarea 
          value={content.storeDescription || ""}
          onChange={(e) => onChange({ ...content, storeDescription: e.target.value })}
          placeholder="Brief description for the footer..."
          rows={2}
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Store Address</FormLabel>
        <Textarea 
          value={content.storeAddress || ""}
          onChange={(e) => onChange({ ...content, storeAddress: e.target.value })}
          placeholder="123 Main St..."
          rows={2}
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Copyright Text</FormLabel>
        <Input 
          value={content.copyrightText || ""}
          onChange={(e) => onChange({ ...content, copyrightText: e.target.value })}
          placeholder="© 2026 StoreName"
          className="rounded-lg bg-background border-border"
        />
      </div>
      
      <div className="pt-2">
        <FormLabel className="mb-2 block">Social Links</FormLabel>
        <div className="grid grid-cols-1 gap-3">
          <Input 
            value={links.facebook || ""}
            onChange={(e) => onChange({ ...content, socialLinks: { ...links, facebook: e.target.value } })}
            placeholder="Facebook URL"
            className="rounded-lg bg-background border-border"
          />
          <Input 
            value={links.instagram || ""}
            onChange={(e) => onChange({ ...content, socialLinks: { ...links, instagram: e.target.value } })}
            placeholder="Instagram URL"
            className="rounded-lg bg-background border-border"
          />
          <Input 
            value={links.whatsapp || ""}
            onChange={(e) => onChange({ ...content, socialLinks: { ...links, whatsapp: e.target.value } })}
            placeholder="WhatsApp Number"
            className="rounded-lg bg-background border-border"
          />
          <Input 
            value={links.tiktok || ""}
            onChange={(e) => onChange({ ...content, socialLinks: { ...links, tiktok: e.target.value } })}
            placeholder="TikTok URL"
            className="rounded-lg bg-background border-border"
          />
        </div>
      </div>
    </div>
  )
}
