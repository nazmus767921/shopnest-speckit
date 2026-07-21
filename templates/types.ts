import React from "react"
import {
  HeroContent,
  FeaturedProductsContent,
  CategoryShowcaseContent,
  PromoBannerContent,
  BrandStoryContent,
  TestimonialsContent,
  NewsletterContent,
  FAQContent,
  AnnouncementBarContent,
  FooterContent,
  StorefrontSection,
} from "@/lib/storefront/schema/sections"

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

// Minimal representations of DB entities
export interface MerchantStore {
  id: string
  name: string
  subdomain: string
  template: string
  themeSettings?: ThemeSettings | null
}

export interface User {
  id: string
  email: string
  name?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parentId?: string | null
  imageUrl?: string | null
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

export interface MenuWithItems {
  id: string
  name: string
  items: Array<{
    id: string
    label: string
    url: string
    order: number
  }>
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

// 1. StorefrontContext
export interface StorefrontContext {
  // Core Entities
  store: MerchantStore;
  merchant: User;
  
  // Template Resolution
  templateSlug: string;
  isPreview: boolean;
  
  // Content & Navigation
  sections: StorefrontSection[];
  menus: {
    main?: MenuWithItems;
    footer?: MenuWithItems;
  };
  categories: Category[];
  
  // Styling
  themeVars: Record<string, string>;
}

// Props for Pages and Shell
export interface ShellProps {
  store: MerchantStore;
  menus: StorefrontContext['menus'];
  categories: Category[];
  themeVars: Record<string, string>;
  children: React.ReactNode;
}

export interface HomePageProps {
  store: MerchantStore;
  sections: StorefrontSection[];
}

export interface PLPProps {
  store: MerchantStore;
  products: Product[];
  categories: Category[];
  activeFilters: FilterState;
  pagination: PaginationState;
}

export interface PDPProps {
  store: MerchantStore;
  product: Product;
  relatedProducts: Product[];
  faqs?: Array<{ question: string; answer: string }>;
}

export interface StandardPageProps {
  store: MerchantStore;
  page: {
    id: string;
    title: string;
    content: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
  };
}

// 2. Template Contract (TemplateModule)
export interface TemplateMetadata {
  slug: string;
  name: string;
  description: string;
  thumbnail?: string;
  defaultTheme: {
    colors: Record<string, string>;
    fonts: { display: string; sans: string };
    radius: string;
  };
  layoutConfig: {
    hasSidebar: boolean;
    maxWidth: 'standard' | 'wide' | 'full';
  };
}

export interface TemplateModule {
  metadata: TemplateMetadata;
  
  // Layout
  Shell: React.ComponentType<ShellProps>;
  
  // Pages
  pages: {
    home: React.ComponentType<HomePageProps>;
    plp: React.ComponentType<PLPProps>;
    pdp: React.ComponentType<PDPProps>;
    standard: React.ComponentType<StandardPageProps>;
  };
  
  // Section Renderers (Must implement all 10)
  sections: {
    hero: React.ComponentType<{ content: HeroContent, merchantId: string, subdomain: string }>;
    featured_products: React.ComponentType<{ content: FeaturedProductsContent, merchantId: string, subdomain: string }>;
    category_showcase: React.ComponentType<{ content: CategoryShowcaseContent, merchantId: string, subdomain: string }>;
    promo_banner: React.ComponentType<{ content: PromoBannerContent, merchantId: string, subdomain: string }>;
    brand_story: React.ComponentType<{ content: BrandStoryContent, merchantId: string, subdomain: string }>;
    testimonials: React.ComponentType<{ content: TestimonialsContent, merchantId: string, subdomain: string }>;
    newsletter: React.ComponentType<{ content: NewsletterContent, merchantId: string, subdomain: string }>;
    faq: React.ComponentType<{ content: FAQContent, merchantId: string, subdomain: string }>;
    announcement_bar: React.ComponentType<{ content: AnnouncementBarContent, merchantId: string, subdomain: string }>;
    footer: React.ComponentType<{ content: FooterContent, merchantId: string, subdomain: string }>;
  };
}
