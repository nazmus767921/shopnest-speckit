---
name: storefront-template
description: Use when building, modifying, or scaffolding a new storefront template for ShopNest. Contains strict architectural rules, the 10-section universal catalog, and the AI workflow for generating templates.
---

# Storefront Template Workflow

When asked to create or modify a storefront template, you MUST follow these architectural rules.

## 1. Scaffold First

Always start by running the scaffold script. DO NOT create files manually.

\`\`\`bash
bun run scaffold:template <template-slug>
\`\`\`

## 2. Register Template

Open `templates/registry.ts` and add the new template.

\`\`\`typescript
import { <template-slug>Template } from "./<template-slug>";

export const templates: Record<string, TemplateModule> = {
  // ...
  '<template-slug>': <template-slug>Template,
};
\`\`\`

## 3. Implement Sections

The template MUST implement all 10 core sections defined in `templates/types.ts`.
- `announcement_bar`
- `hero`
- `category_showcase`
- `featured_products`
- `promo_banner`
- `brand_story`
- `testimonials`
- `newsletter`
- `faq`
- `footer`

## 4. Shared Primitives

For common UI elements, use the shared primitives in `components/storefront/primitives/`.
- `ProductCard.tsx`
- `CategoryCard.tsx`
- `PriceDisplay.tsx`
- `StarRating.tsx`
- `NewsletterForm.tsx`

Do NOT rewrite these components for each template. They respond to global CSS variables.

## 5. CSS Architecture

Write template-specific styles in `templates/<template-slug>/styles.css`.
Do NOT define root variables like `--color-primary` here. These are injected dynamically from the DB settings via `StorefrontThemeWrapper`.
Instead, use standard classes mapped to the global variables:

\`\`\`css
.storefront-template-mytheme .custom-button {
  background-color: var(--color-primary);
}
\`\`\`

## 6. Contract Testing

Ensure your template passes the contract tests by running:

\`\`\`bash
bun test templates/<template-slug>/__tests__/contract.test.ts
\`\`\`
