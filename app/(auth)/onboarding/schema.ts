import { z } from "zod"

export const onboardingSchema = z.object({
  name: z
    .string()
    .min(2, "Store name must be at least 2 characters")
    .max(100, "Store name must be under 100 characters"),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63, "Subdomain must be under 63 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Subdomain can only contain lowercase letters, numbers, and hyphens"
    )
    .refine(
      (val) => !val.startsWith("-") && !val.endsWith("-"),
      "Subdomain cannot start or end with a hyphen"
    ),
  plan: z.string().min(1, "Plan is required").default("starter"),
  businessType: z.string().min(1, "Please select a business type").default("general"),
})
