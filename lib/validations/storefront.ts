import { z } from "zod"

export const socialLinksSchema = z.object({
  facebook: z.url({ message: "Invalid Facebook URL." }).optional().or(z.literal("")),
  instagram: z.url({ message: "Invalid Instagram URL." }).optional().or(z.literal("")),
  whatsapp: z.string().max(20, "WhatsApp number too long.").optional().or(z.literal("")),
  tiktok: z.url({ message: "Invalid TikTok URL." }).optional().or(z.literal("")),
})

export const faqItemSchema = z.object({
  question: z.string().min(3, "Question too short.").max(150, "Question too long."),
  answer: z.string().min(3, "Answer too short.").max(600, "Answer too long."),
})

export const storefrontLayoutSchema = z.object({
  heroImageUrl: z.url({ message: "Invalid image URL." }).optional().nullable(),
  subtitle: z.string().max(120, "Subtitle must be under 120 characters.").optional().nullable().or(z.literal("")),
  storeDescription: z.string().max(500, "Description must be under 500 characters.").optional().nullable().or(z.literal("")),
  storeAddress: z.string().max(200, "Address must be under 200 characters.").optional().nullable().or(z.literal("")),
  socialLinks: socialLinksSchema.optional(),
  customFaqs: z.array(faqItemSchema).max(8, "Maximum 8 FAQs allowed.").optional(),
})

export type StorefrontLayoutValues = z.infer<typeof storefrontLayoutSchema>
export type SocialLinks = z.infer<typeof socialLinksSchema>
export type FaqItem = z.infer<typeof faqItemSchema>
