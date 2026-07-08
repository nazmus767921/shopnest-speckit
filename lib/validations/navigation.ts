import { z } from "zod"

export const menuSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
})

export const menuItemSchema = z.object({
  id: z.string().uuid("Invalid item ID"),
  parentId: z.string().uuid("Invalid parent ID").nullable().optional(),
  label: z.string()
    .min(1, "Label is required")
    .max(30, "Label must be 30 characters or less"),
  type: z.enum(["url", "page", "category", "product"]),
  referenceId: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  position: z.number().int().default(0),
}).superRefine((data, ctx) => {
  if (data.type === "url" && (!data.url || data.url.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["url"],
      message: "URL is required for custom links",
    })
  }
  if (data.type !== "url" && !data.referenceId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["referenceId"],
      message: "Please select a target item",
    })
  }
})

export const menuItemsListSchema = z.array(menuItemSchema)

export type MenuFormValues = z.infer<typeof menuSchema>
export type MenuItemFormValues = z.infer<typeof menuItemSchema>
