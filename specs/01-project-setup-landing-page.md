# Spec: 01 - Project Setup & Landing Page

## Goal
Initialize the Next.js 16+ repository with Tailwind CSS v4, Lucide React, and build the foundational in-house UI components. Construct the public-facing ShopNest landing page `(marketing)/page.tsx` to communicate features, pricing, and drive merchant registrations.

## Design
- **Aesthetic:** Modern, premium SaaS feel with a vibrant, clean look. Micro-animations on interactive elements (hover states, scroll reveals), subtle glassmorphism, and a polished, high-contrast visual hierarchy.
- **Typography:** Modern sans-serif (e.g., Inter or Outfit) via `next/font/google` for a clean, legible experience.
- **Landing Page Structure:**
  1. **Hero Section:** Clear value proposition ("Turn your Facebook boutique into a professional storefront"), primary CTA to "Start Free Trial", and a secondary CTA for "Login".
  2. **Features Section:** Highlighting branded subdomains, bKash/Nagad order flow, live stock management, and the mobile-first merchant dashboard.
  3. **Pricing Section:** Clear comparison between Starter (৳499/mo) and Growth (৳1499/mo) plans.
  4. **Footer:** Simple branding and placeholder links.
- **UI Components:** We will implement the first batch of strictly accessible (WCAG 2.1 AA) custom Tailwind components needed for the landing page: `Button`, `Card` (and sub-components), `Badge`, `Stack`, and `Grid`.

## Implementation
### 1. Repository Setup
- [x] Initialize the Next.js 16+ App Router project (TypeScript, ESLint).
- [x] Configure Tailwind CSS v4.
- [x] Install `lucide-react` for iconography.
- [x] Install utility packages `clsx` and `tailwind-merge` for robust component class composition.
- [x] Map design tokens from `DESIGN.md` into `app/globals.css`.
- [ ] Create the fundamental route group structure: `app/(marketing)`.

### 2. UI Component Foundation
- **`components/ui/primitives/Button.tsx`**: Support variants (primary, secondary, outline, ghost) and sizes, ensuring accessibility and focus states.
- **`components/ui/layout/Card.tsx`**: Create flexible compound components (`Card`, `CardHeader`, `CardTitle`, `CardContent`) for pricing and feature displays.
- **`components/ui/primitives/Badge.tsx`**: For emphasizing plan features (e.g., "7-Day Free Trial").
- **`components/ui/index.ts`**: Barrel export for the UI library.

### 3. Landing Page Construction
- **`app/(marketing)/layout.tsx`**: Implement a persistent Navbar with the ShopNest logo and navigation links.
- **`app/(marketing)/page.tsx`**: Assemble the Hero, Features, and Pricing sections using the newly created UI components.
- Ensure all sections are strictly mobile-first, targeting mid-range Android devices on 4G connections as a baseline.

## Dependencies
- `next` (16+)
- `react`, `react-dom`
- `tailwindcss` (v4+)
- `@tailwindcss/postcss`
- `lucide-react`
- `clsx`
- `tailwind-merge`

## Verification Checklist
- [x] Next.js app starts successfully on development server.
- [x] Tailwind CSS v4 compiles and applies utility classes correctly.
- [x] `(marketing)/page.tsx` renders without any hydration errors.
- [x] The landing page is fully responsive down to 320px screen width.
- [x] All interactive elements (Buttons, links) have visible hover/focus states and meet WCAG 2.1 AA contrast ratios.
- [x] No third-party UI component libraries (e.g., Shadcn, MUI, Chakra) are used; all UI is imported from `components/ui/`.
- [x] Placeholder links to `/register` and `/login` are present and clickable.
