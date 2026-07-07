import React from "react"
import { StorefrontSection } from "@/lib/storefront-sections/types"

export interface StoreData {
  id: string
  name: string
  subdomain: string
  template: string
  heroImageUrl: string | null
  subtitle: string | null
  description: string | null
  address: string | null
  socialLinks: Record<string, string> | null
  customFaqs: Array<{ question: string; answer: string }> | null
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
  category: { id: string; name: string } | null
  promotions: Array<{ promotionType: string }>
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
  featuredProducts: Product[]
  categories: CategoryWithProducts[]
  newArrivals: Product[]
  sections?: StorefrontSection[]
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
}

export interface CartPageProps {
  store: StoreData
}

export interface NavbarProps {
  store: StoreData
  subdomain: string
}

export interface FooterProps {
  store: StoreData
}

export interface TemplateModule {
  HomePage: React.ComponentType<HomePageProps>
  PLP: React.ComponentType<PLPProps>
  PDP: React.ComponentType<PDPProps>
  CartPage: React.ComponentType<CartPageProps>
  Navbar: React.ComponentType<NavbarProps>
  Footer: React.ComponentType<FooterProps>
}
