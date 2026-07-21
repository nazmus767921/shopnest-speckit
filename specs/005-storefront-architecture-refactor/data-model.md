# Data Model: Storefront Architecture Refactor

**Feature**: 005-storefront-architecture-refactor

This document outlines the core domain entities and TypeScript models that drive the new storefront architecture. Note that the underlying PostgreSQL database schema (Drizzle) for these entities remains largely unchanged; this model focuses on the application-layer types and Zod schemas used to enforce contracts.

## 1. StorefrontContext

The unified context object returned by the Data Access Layer (DAL) for every storefront request.

```typescript
export interface StorefrontContext {
  // Core Entities
  store: MerchantStore;            // DB Merchant record
  merchant: User;                  // DB User record (store owner)
  
  // Template Resolution
  templateSlug: string;            // The resolved template slug (handles fallback & preview)
  template: TemplateModule;        // The active template module instance
  isPreview: boolean;              // True if rendered via ?template_preview=slug
  
  // Content & Navigation
  sections: StorefrontSection[];   // Typed sections from DB
  menus: {
    main?: MenuWithItems;
    footer?: MenuWithItems;
  };
  categories: Category[];          // All published categories for the store
  
  // Styling
  themeVars: Record<string, string>; // CSS variables for the template's theme
}
```

## 2. Template Contract (`TemplateModule`)

The strict contract that every registered template must fulfill.

```typescript
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

export interface ShellProps {
  store: MerchantStore;
  menus: StorefrontContext['menus'];
  categories: Category[];
  themeVars: Record<string, string>;
  children: React.ReactNode;
}
```

## 3. Discriminated Section Types

Sections are stored in the DB with a generic `JSONB` content field. We enforce structure using a discriminated union and Zod.

```typescript
// Base Zod schema example
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

// The Discriminated Union
export type StorefrontSection = 
  | { sectionKey: 'hero'; content: HeroContent; sortOrder: number; isVisible: boolean }
  | { sectionKey: 'featured_products'; content: FeaturedProductsContent; sortOrder: number; isVisible: boolean }
  | { sectionKey: 'category_showcase'; content: CategoryShowcaseContent; sortOrder: number; isVisible: boolean }
  // ... (all 10 sections)
```

## 4. Product Formatting (Canonical Product)

The `formatProduct()` utility transforms raw DB rows into this canonical shape.

```typescript
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pricePaisa: number;
  compareAtPricePaisa: number | null;
  stockCount: number;
  lowStockThreshold: number;
  categoryId: string | null;
  status: 'draft' | 'published' | 'archived';
  
  // Resolved Relationships
  images: ProductImage[];
  category: { id: string; name: string; slug: string } | null;
  
  // Variants (Resolved from JSONB or relational rows)
  attributes: ProductAttribute[];
  variants: ProductVariant[];
}
```
