# Storefront Template Authoring Guide

This document defines the strict contract and rules for authoring new ShopNest storefront templates.

## Philosophy

ShopNest storefronts are built on a highly-constrained, designer-controlled architecture. 
**Merchants are content editors, not designers.**
Templates dictate the layout, colors, typography, and section order. The merchant only provides the content (text, images, and data source selections).

## 1. The Universal Section Catalog

Every template must implement ALL 10 of these core sections, even if it's just a placeholder.

1. `announcement_bar` (Optional toggle) - Top promotional strip
2. `hero` (Core) - Main banner
3. `category_showcase` (Core) - Browse by category
4. `featured_products` (Core) - Curated product grid
5. `promo_banner` (Optional toggle) - Mid-page callout
6. `brand_story` (Optional toggle) - Narrative and image
7. `testimonials` (Optional toggle) - Social proof
8. `newsletter` (Optional toggle) - Email capture
9. `faq` (Optional toggle) - Frequently asked questions
10. `footer` (Core) - Footer links and info

Core sections cannot be hidden by the merchant. Optional sections can be toggled on/off.

## 2. Template Module Contract

Each template must export a `TemplateModule` object matching this interface:

```typescript
export interface TemplateModule {
  metadata: {
    slug: string;
    name: string;
    description: string;
    defaultTheme: {
      colors: Record<string, string>;
      fonts: { display: string; sans: string };
      radius: string;
    };
    layoutConfig: {
      hasSidebar: boolean;
      maxWidth: 'standard' | 'wide' | 'full';
    };
  };
  Shell: React.ComponentType<ShellProps>;
  pages: {
    home: React.ComponentType<HomePageProps>;
    plp: React.ComponentType<PLPProps>;
    pdp: React.ComponentType<PDPProps>;
    standard: React.ComponentType<StandardPageProps>;
  };
  sections: {
    hero: React.ComponentType<SectionProps>;
    featured_products: React.ComponentType<SectionProps>;
    // ... all 10 sections
  };
}
```

## 3. Shared Primitives

When building sections, do not reinvent the wheel. Use the shared primitives located in `components/storefront/primitives/`:
- `ProductCard.tsx`
- `CategoryCard.tsx`
- `PriceDisplay.tsx`
- `StarRating.tsx`
- `NewsletterForm.tsx`

These primitives adapt to global theme tokens (like `--color-primary`, `--radius`, etc.).

## 4. CSS Strategy

All template-specific styles should go in `templates/<slug>/styles.css`.
Do not define global variables here. Global variables (`--color-primary`, etc.) are injected automatically via the `StorefrontThemeWrapper` (from merchant settings or the template's defaultTheme).
Instead, map your template classes to these global variables.

## 5. Scaffold Script

The easiest way to start a new template is using the scaffold script:
\`\`\`bash
bun run scaffold:template my-template-name
\`\`\`

After scaffolding, register the template in `templates/registry.ts`.
