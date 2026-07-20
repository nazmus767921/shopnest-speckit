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
  FeaturedProductsContent,
  PromoBannerContent,
  BrandStoryContent,
  TestimonialsContent,
  NewsletterContent,
  FaqContent,
  FooterContent
} from "@/lib/storefront-sections/types"
import { Button } from "@/components/ui/button"
import { Trash2Icon, PlusIcon, InfoIcon, FacebookIcon, InstagramIcon, WhatsAppIcon, TikTokIcon } from "@/lib/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

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
      <div className="flex flex-col gap-1.5">
        <FormLabel>Link (Optional)</FormLabel>
        <Input
          value={content.link || ""}
          onChange={(e) => onChange({ ...content, link: e.target.value })}
          placeholder="/sale"
          className="rounded-lg bg-background border-border"
        />
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
      <div className="p-3 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground">
        Note: Selecting specific categories is not yet implemented in this editor. It will display all active categories by default.
      </div>
    </div>
  )
}

export function FeaturedProductsEditor({ content, onChange }: { content: FeaturedProductsContent, onChange: (c: FeaturedProductsContent) => void }) {
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
        <FormLabel>Data Source</FormLabel>
        <Select
          value={content.gridType || "featured"}
          onValueChange={(val) => onChange({ ...content, gridType: val as any })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Grid Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured Products</SelectItem>
            <SelectItem value="new_arrivals">New Arrivals</SelectItem>
            <SelectItem value="exclusive">Exclusive Collection</SelectItem>
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

export function PromoBannerEditor({ content, onChange }: { content: PromoBannerContent, onChange: (c: PromoBannerContent) => void }) {
  return (
    <div className="flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Title</FormLabel>
        <Input
          value={content.title || ""}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Special Offer"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Subtitle</FormLabel>
        <Input
          value={content.subtitle || ""}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          placeholder="20% off everything"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Button Text</FormLabel>
        <Input
          value={content.buttonText || ""}
          onChange={(e) => onChange({ ...content, buttonText: e.target.value })}
          placeholder="Shop Now"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Button Link</FormLabel>
        <Input
          value={content.buttonLink || ""}
          onChange={(e) => onChange({ ...content, buttonLink: e.target.value })}
          placeholder="/sale"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Image URL (Optional)</FormLabel>
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

export function BrandStoryEditor({ content, onChange }: { content: BrandStoryContent, onChange: (c: BrandStoryContent) => void }) {
  return (
    <div className="flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Title</FormLabel>
        <Input
          value={content.title || ""}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Our Story"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Description</FormLabel>
        <Textarea
          value={content.description || ""}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          placeholder="Tell your brand's story..."
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

export function TestimonialsEditor({ content, onChange }: { content: TestimonialsContent, onChange: (c: TestimonialsContent) => void }) {
  const testimonials = content.testimonials || []

  return (
    <div className="flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Heading</FormLabel>
        <Input
          value={content.heading || ""}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="What our customers say"
          className="rounded-lg bg-background border-border"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <FormLabel>Reviews</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (testimonials.length < 5) {
                onChange({ ...content, testimonials: [...testimonials, { name: "", text: "", rating: 5 }] })
              }
            }}
            disabled={testimonials.length >= 5}
            className="h-8 rounded-full"
          >
            <PlusIcon className="w-4 h-4 mr-1" /> Add Review
          </Button>
        </div>

        {testimonials.map((item, idx) => (
          <div key={idx} className="flex gap-3 items-start border border-border p-4 rounded-xl bg-card flex-col">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium">Review #{idx + 1}</span>
              <button
                type="button"
                onClick={() => {
                  const newTestimonials = [...testimonials]
                  newTestimonials.splice(idx, 1)
                  onChange({ ...content, testimonials: newTestimonials })
                }}
                className="text-muted-foreground/60 hover:text-destructive p-1 cursor-pointer transition-colors"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
            </div>
            <Input
              value={item.name}
              onChange={(e) => {
                const newTestimonials = [...testimonials]
                newTestimonials[idx].name = e.target.value
                onChange({ ...content, testimonials: newTestimonials })
              }}
              placeholder="Customer Name"
              className="rounded-lg bg-background border-border"
            />
            <Textarea
              value={item.text}
              onChange={(e) => {
                const newTestimonials = [...testimonials]
                newTestimonials[idx].text = e.target.value
                onChange({ ...content, testimonials: newTestimonials })
              }}
              placeholder="Testimonial text..."
              rows={2}
              className="rounded-lg bg-background border-border"
            />
            <div className="flex gap-2 w-full">
              <Input
                type="number"
                min="1"
                max="5"
                value={item.rating || 5}
                onChange={(e) => {
                  const newTestimonials = [...testimonials]
                  newTestimonials[idx].rating = parseInt(e.target.value) || 5
                  onChange({ ...content, testimonials: newTestimonials })
                }}
                placeholder="Rating (1-5)"
                className="rounded-lg bg-background border-border w-1/3"
              />
              <Input
                value={item.avatarUrl || ""}
                onChange={(e) => {
                  const newTestimonials = [...testimonials]
                  newTestimonials[idx].avatarUrl = e.target.value
                  onChange({ ...content, testimonials: newTestimonials })
                }}
                placeholder="Avatar URL (optional)"
                className="rounded-lg bg-background border-border w-2/3"
              />
            </div>
          </div>
        ))}
        {testimonials.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No testimonials added yet.</p>
        )}
      </div>
    </div>
  )
}

export function NewsletterEditor({ content, onChange }: { content: NewsletterContent, onChange: (c: NewsletterContent) => void }) {
  return (
    <div className="flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Heading</FormLabel>
        <Input
          value={content.heading || ""}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Subscribe to our newsletter"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Subheading</FormLabel>
        <Input
          value={content.subheading || ""}
          onChange={(e) => onChange({ ...content, subheading: e.target.value })}
          placeholder="Get the latest updates..."
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Placeholder Text</FormLabel>
        <Input
          value={content.placeholder || ""}
          onChange={(e) => onChange({ ...content, placeholder: e.target.value })}
          placeholder="Enter your email"
          className="rounded-lg bg-background border-border"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FormLabel>Button Text</FormLabel>
        <Input
          value={content.buttonText || ""}
          onChange={(e) => onChange({ ...content, buttonText: e.target.value })}
          placeholder="Subscribe"
          className="rounded-lg bg-background border-border"
        />
      </div>
    </div>
  )
}

export function FaqEditor({ content, onChange }: { content: FaqContent, onChange: (c: FaqContent) => void }) {
  const questions = content.questions || []

  return (
    <div className="flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-1.5">
        <FormLabel>Title</FormLabel>
        <Input
          value={content.heading || ""}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
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
              if (questions.length < 8) {
                onChange({ ...content, questions: [...questions, { question: "", answer: "" }] })
              }
            }}
            disabled={questions.length >= 8}
            className="h-8 rounded-full"
          >
            <PlusIcon className="w-4 h-4 mr-1" /> Add FAQ
          </Button>
        </div>

        {questions.map((item, idx) => (
          <div key={idx} className="flex gap-3 items-start border border-border p-4 rounded-xl bg-card">
            <div className="flex flex-col gap-3 flex-1">
              <Input
                value={item.question}
                onChange={(e) => {
                  const newQuestions = [...questions]
                  newQuestions[idx].question = e.target.value
                  onChange({ ...content, questions: newQuestions })
                }}
                placeholder="Question"
                className="rounded-lg bg-background border-border"
              />
              <Textarea
                value={item.answer}
                onChange={(e) => {
                  const newQuestions = [...questions]
                  newQuestions[idx].answer = e.target.value
                  onChange({ ...content, questions: newQuestions })
                }}
                placeholder="Answer"
                rows={2}
                className="rounded-lg bg-background border-border"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const newQuestions = [...questions]
                newQuestions.splice(idx, 1)
                onChange({ ...content, questions: newQuestions })
              }}
              className="text-muted-foreground/60 hover:text-destructive p-2 cursor-pointer transition-colors"
            >
              <Trash2Icon className="w-4 h-4" />
            </button>
          </div>
        ))}
        {questions.length === 0 && (
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
        <InfoIcon className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0 mt-1" />
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
          <InputGroup>
            <InputGroupAddon>
              <FacebookIcon className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              value={links.facebook || ""}
              onChange={(e) => onChange({ ...content, socialLinks: { ...links, facebook: e.target.value } })}
              placeholder="Facebook URL"
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <InstagramIcon className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              value={links.instagram || ""}
              onChange={(e) => onChange({ ...content, socialLinks: { ...links, instagram: e.target.value } })}
              placeholder="Instagram URL"
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <WhatsAppIcon className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              value={links.whatsapp || ""}
              onChange={(e) => onChange({ ...content, socialLinks: { ...links, whatsapp: e.target.value } })}
              placeholder="WhatsApp Number"
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <TikTokIcon className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              value={links.tiktok || ""}
              onChange={(e) => onChange({ ...content, socialLinks: { ...links, tiktok: e.target.value } })}
              placeholder="TikTok URL"
            />
          </InputGroup>
        </div>
      </div>
    </div>
  )
}
