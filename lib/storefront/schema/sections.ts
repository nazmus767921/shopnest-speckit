import { z } from "zod";

// 1. Hero
export const heroContentSchema = z.object({
  headline: z.string().default("Welcome to our store"),
  subheadline: z.string().optional(),
  primaryButtonLabel: z.string().default("Shop Now"),
  primaryButtonLink: z.string().default("/products"),
  secondaryButtonLabel: z.string().optional(),
  secondaryButtonLink: z.string().optional(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  layout: z.enum(["center", "left", "split"]).default("center"),
});
export type HeroContent = z.infer<typeof heroContentSchema>;

// 2. Featured Products
export const featuredProductsContentSchema = z.object({
  headline: z.string().default("Featured Products"),
  subheadline: z.string().optional(),
  productIds: z.array(z.string()).default([]),
  layout: z.enum(["grid", "carousel"]).default("grid"),
});
export type FeaturedProductsContent = z.infer<typeof featuredProductsContentSchema>;

// 3. Category Showcase
export const categoryShowcaseContentSchema = z.object({
  headline: z.string().default("Shop by Category"),
  categoryIds: z.array(z.string()).default([]),
});
export type CategoryShowcaseContent = z.infer<typeof categoryShowcaseContentSchema>;

// 4. Promo Banner
export const promoBannerContentSchema = z.object({
  text: z.string().default("Special Offer"),
  buttonLabel: z.string().optional(),
  buttonLink: z.string().optional(),
  backgroundColor: z.string().optional(),
});
export type PromoBannerContent = z.infer<typeof promoBannerContentSchema>;

// 5. Brand Story
export const brandStoryContentSchema = z.object({
  headline: z.string().default("Our Story"),
  content: z.string().default(""),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
});
export type BrandStoryContent = z.infer<typeof brandStoryContentSchema>;

// 6. Testimonials
export const testimonialsContentSchema = z.object({
  headline: z.string().default("What our customers say"),
  testimonials: z.array(
    z.object({
      quote: z.string(),
      author: z.string(),
      rating: z.number().min(1).max(5).default(5),
    })
  ).default([]),
});
export type TestimonialsContent = z.infer<typeof testimonialsContentSchema>;

// 7. Newsletter
export const newsletterContentSchema = z.object({
  headline: z.string().default("Subscribe to our newsletter"),
  subheadline: z.string().optional(),
  buttonLabel: z.string().default("Subscribe"),
});
export type NewsletterContent = z.infer<typeof newsletterContentSchema>;

// 8. FAQ
export const faqContentSchema = z.object({
  headline: z.string().default("Frequently Asked Questions"),
  faqs: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ).default([]),
});
export type FAQContent = z.infer<typeof faqContentSchema>;

// 9. Announcement Bar
export const announcementBarContentSchema = z.object({
  text: z.string().default("Free shipping on all orders!"),
  link: z.string().optional(),
  isActive: z.boolean().default(true),
});
export type AnnouncementBarContent = z.infer<typeof announcementBarContentSchema>;

// 10. Footer
export const footerContentSchema = z.object({
  description: z.string().optional(),
  showSocials: z.boolean().default(true),
  copyrightText: z.string().optional(),
});
export type FooterContent = z.infer<typeof footerContentSchema>;

// Discriminated Union
export type StorefrontSection =
  | { sectionKey: 'hero'; content: HeroContent; sortOrder: number; isVisible: boolean }
  | { sectionKey: 'featured_products'; content: FeaturedProductsContent; sortOrder: number; isVisible: boolean }
  | { sectionKey: 'category_showcase'; content: CategoryShowcaseContent; sortOrder: number; isVisible: boolean }
  | { sectionKey: 'promo_banner'; content: PromoBannerContent; sortOrder: number; isVisible: boolean }
  | { sectionKey: 'brand_story'; content: BrandStoryContent; sortOrder: number; isVisible: boolean }
  | { sectionKey: 'testimonials'; content: TestimonialsContent; sortOrder: number; isVisible: boolean }
  | { sectionKey: 'newsletter'; content: NewsletterContent; sortOrder: number; isVisible: boolean }
  | { sectionKey: 'faq'; content: FAQContent; sortOrder: number; isVisible: boolean }
  | { sectionKey: 'announcement_bar'; content: AnnouncementBarContent; sortOrder: number; isVisible: boolean }
  | { sectionKey: 'footer'; content: FooterContent; sortOrder: number; isVisible: boolean };
