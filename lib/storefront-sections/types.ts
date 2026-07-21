export type HeroContent = {
  title: string
  subtitle?: string
  buttonText?: string
  buttonLink?: string
  imageUrl?: string
}

export type AnnouncementBarContent = {
  text: string
  link?: string
}

export type CategoryShowcaseContent = {
  title: string
  categoryIds: string[] // Array of category UUIDs
}

export type FeaturedProductsContent = {
  title: string
  gridType: 'new_arrivals' | 'featured' | 'exclusive' | 'manual_selection'
  productIds?: string[] // Used when gridType is manual_selection
}

export type PromoBannerContent = {
  title: string
  subtitle?: string
  buttonText?: string
  buttonLink?: string
  imageUrl?: string
}

export type BrandStoryContent = {
  title: string
  description: string
  imageUrl?: string
  buttonText?: string
  buttonLink?: string
}

export type Testimonial = {
  name: string
  text: string
  rating?: number
  avatarUrl?: string
}

export type TestimonialsContent = {
  heading?: string
  testimonials: Testimonial[]
}

export type NewsletterContent = {
  heading?: string
  subheading?: string
  placeholder?: string
  buttonText?: string
}

export type FaqContent = {
  heading?: string
  questions: { question: string; answer: string }[]
}

export type FooterContent = {
  storeDescription?: string
  storeAddress?: string
  socialLinks?: Record<string, string>
  showPaymentBadges: boolean
  copyrightText?: string
}

// A discriminated union could be used, but since the JSONB is loosely typed at the DB level,
// we provide a generic or combined type for frontend flexibility.
export type StorefrontSectionContent =
  | HeroContent
  | AnnouncementBarContent
  | CategoryShowcaseContent
  | FeaturedProductsContent
  | PromoBannerContent
  | BrandStoryContent
  | TestimonialsContent
  | NewsletterContent
  | FaqContent
  | FooterContent

export type StorefrontSection = {
  id: string
  merchantId: string
  sectionKey: string // 'hero', 'announcement_bar', 'category_showcase', 'brand_story', etc.
  content: StorefrontSectionContent | Record<string, any>
  sortOrder: number
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
}
