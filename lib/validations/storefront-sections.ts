import { z } from "zod"

export const heroContentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  overlayOpacity: z.number().min(0).max(100, "Number must be less than or equal to 100").optional().default(50),
})

export const announcementBarContentSchema = z.object({
  text: z.string().min(1, "Text is required"),
  link: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
})

export const categoryShowcaseContentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  categoryIds: z.array(z.string()).default([]),
  layout: z.enum(["grid", "mosaic"]).optional().default("grid"),
})

export const aboutContentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
})

// Used by server actions to validate arbitrary sections array
export const storefrontSectionInputSchema = z.object({
  sectionKey: z.string().min(1, "Section key is required"),
  content: z.record(z.string(), z.any()).default({}), // Server validates based on sectionKey later, or frontend does
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
})

export const faqContentSchema = z.object({
  heading: z.string().optional(),
  questions: z.array(z.object({
    question: z.string().min(1, "Question is required"),
    answer: z.string().min(1, "Answer is required")
  })).default([]),
})

export const footerContentSchema = z.object({
  storeDescription: z.string().optional(),
  storeAddress: z.string().optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  showPaymentBadges: z.boolean().default(true),
  copyrightText: z.string().optional(),
})

export const updateStorefrontSectionsSchema = z.array(storefrontSectionInputSchema)
