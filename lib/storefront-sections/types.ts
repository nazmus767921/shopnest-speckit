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

// A discriminated union could be used, but since the JSONB is loosely typed at the DB level,
// we provide a generic or combined type for frontend flexibility.
export type StorefrontSectionContent =
  | HeroContent
  | AnnouncementBarContent
  | CategoryShowcaseContent
  | AboutContent

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
