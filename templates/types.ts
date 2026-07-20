import React from "react"
import { StorefrontSection } from "@/lib/storefront-sections/types"
import { SectionKey } from "@/lib/storefront-sections/section-catalog"

export interface ThemeSettings {
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    text?: string
  }
  typography?: {
    headingFont?: string
    bodyFont?: string
  }
  layout?: {
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  }
}

export interface StoreData {
  id: string
  name: string
  subdomain: string
  template: string
  themeSettings?: ThemeSettings | null
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  pricePaisa: number
  compareAtPricePaisa: number | null
  stockCount: number
  lowStockThreshold: number
  images: Array<{ storagePath: string }>
  category: { id: string; name: string; slug?: string } | null
  promotions: Array<{ promotionType: string }>
  flashSales?: Array<{
    id: string
    salePricePaisa: number
    limitQuantity: number
    soldQuantity: number
    startTime: string
    endTime: string
    isActive: boolean
  }>
  attributes: Array<{
    name: string
    displayType: "swatch" | "dropdown" | "radio"
    options: Array<{
      value: string
      label: string
      swatchColor?: string
    }>
  }>
  variants: Array<{
    id: string
    sku: string
    pricePaisa: number | null
    compareAtPricePaisa: number | null
    stockCount: number
    isActive: boolean
    attributeCombination: Record<string, string>
  }>
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parentId?: string | null
  imageUrl?: string | null
}

export interface CategoryWithProducts extends Category {
  products: Product[]
}

export interface FilterState {
  categorySlug?: string
  minPrice?: number
  maxPrice?: number
  sort?: string
}

export interface PaginationState {
  currentPage: number
  totalPages: number
  pageSize: number
}


export interface HomePageProps {
  store: StoreData
  sections: StorefrontSection[]
}

export interface PLPProps {
  store: StoreData
  products: Product[]
  categories: Category[]
  activeFilters: FilterState
  pagination: PaginationState
}

export interface PDPProps {
  store: StoreData
  product: Product
  relatedProducts: Product[]
  faqs?: Array<{ question: string; answer: string }>
}

export interface CartPageProps {
  store: StoreData
}

export interface NavbarProps {
  store: StoreData
  subdomain: string
  menu?: any
  categories?: Category[]
}

export interface FooterProps {
  store: StoreData
  menu?: any
  footerSection?: any
}

export interface StandardPageProps {
  store: StoreData
  page: {
    id: string
    title: string
    content: string
    metaTitle?: string | null
    metaDescription?: string | null
  }
}

export interface SectionProps {
  section: StorefrontSection
  merchantId?: string
  subdomain?: string
}

export interface TemplateModule {
  HomePage: React.ComponentType<HomePageProps>
  PLP: React.ComponentType<PLPProps>
  PDP: React.ComponentType<PDPProps>
  CartPage: React.ComponentType<CartPageProps>
  Navbar: React.ComponentType<NavbarProps>
  Footer: React.ComponentType<FooterProps>
  StandardPage: React.ComponentType<StandardPageProps>
  sections?: Partial<Record<SectionKey, React.ComponentType<SectionProps>>>
}
