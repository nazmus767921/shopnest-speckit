export type HeroContent = {
  title: string
  subtitle?: string
  buttonText?: string
  buttonLink?: string
  imageUrl?: string
  overlayOpacity?: number
}

export type AnnouncementBarContent = {
  text: string
  link?: string
  backgroundColor?: string
  textColor?: string
}

export type CategoryShowcaseContent = {
  title: string
  categoryIds: string[] // Array of category UUIDs
  layout?: 'grid' | 'mosaic'
}

export type AboutContent = {
  title: string
  description: string
  imageUrl?: string
  buttonText?: string
  buttonLink?: string
}

export type ProductGridContent = {
  title: string
  gridType: 'new_arrivals' | 'featured' | 'exclusive' | 'manual_selection'
  productIds?: string[] // Used when gridType is manual_selection
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
  | AboutContent
  | ProductGridContent
  | FaqContent
  | FooterContent

export type StorefrontSection = {
  id: string
  merchantId: string
  sectionKey: string // 'hero', 'announcement_bar', 'category_showcase', 'about', etc.
  content: StorefrontSectionContent | Record<string, any>
  sortOrder: number
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
}
