---
version: beta
name: ShopNest-design-system
description: ShopNest utilizes standard Shadcn UI as its core design system, discarding the previous custom rules in favor of default Shadcn styling, standard shadows, border radiuses, and spacing.
---

## Overview
ShopNest runs on the standard **Shadcn UI** design system. We prioritize consistency, usability, and native web aesthetics. The previous two-canvas system (cinematic vs. transactional) has been discarded in favor of default Shadcn colors and layout patterns.

### Key Characteristics:
- **Default Aesthetic**: Standard Shadcn UI layout, shadows, and spacing.
- **Color Theme**: Defined in `app/globals.css` using Shadcn-standard HSL/oklch color tokens (`--background`, `--foreground`, `--primary`, `--card`, etc.).
- **Typography**: Inter (or sans-serif system fallbacks) for standard UI text, monospaced fonts for technical context.
- **Border Radii**: Default Shadcn radiuses (`--radius`) are utilized for components, buttons, and inputs.

## Components
All core UI elements must be imported from `components/ui/` (e.g., `Button`, `Input`, `Dialog`, `Sheet`, `Card`, etc.). Do not build ad-hoc custom primitives.
