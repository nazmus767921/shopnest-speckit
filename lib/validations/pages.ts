import { z } from "zod"

export const pageSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug is too long").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  content: z.string().optional().nullable(),
  isPublished: z.boolean().default(false),
})

export type PageFormValues = z.infer<typeof pageSchema>
