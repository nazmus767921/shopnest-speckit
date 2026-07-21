# Implementation Plan: json-template-engine

**Branch**: `[006-json-template-engine]` | **Date**: 2026-07-21 | **Spec**: [specs/006-json-template-engine/spec.md](specs/006-json-template-engine/spec.md)

**Input**: Feature specification from `/specs/[006-json-template-engine]/spec.md`

## Summary

Scrap the current constrained template system and rebuild a strictly JSON-driven block architecture. This involves dropping legacy DB tables, purging old templates/sections code, and building a dynamic Render Engine and Visual Drag-and-Drop Editor in the dashboard for Shopify OS 2.0 style theme customization.

## Technical Context

**Language/Version**: TypeScript, Next.js 16

**Primary Dependencies**: React, Next.js, Drizzle ORM, dnd-kit (or HTML5 DnD)

**Storage**: PostgreSQL via Supabase

**Testing**: Vitest

**Target Platform**: Web (Vercel)

**Project Type**: Web Application

**Performance Goals**: Storefront page load < 1.5s, instantaneous live preview in the dashboard editor.

**Constraints**: Must strictly adhere to Next.js 16 RSC boundaries. All data mutations must be validated with Zod and persist via Server Actions. 

## Constitution Check

*GATE: Passed*

- **UI Composition**: The Visual Editor and new section UI will exclusively use Shadcn UI components.
- **Caching**: The Render Engine will use `use cache` sparingly on data fetching layers.
- **Rules Revision**: The legacy constitution rule explicitly forbidding drag-and-drop template editors MUST be amended in `AGENTS.md`.

## Project Structure

### Documentation (this feature)

```text
specs/006-json-template-engine/
├── plan.md              # This file
├── research.md          # Technical decisions
├── data-model.md        # Database schema for JSON templates
├── quickstart.md        # E2E Validation steps
└── tasks.md             # (Generated in next phase)
```

### Source Code

```text
db/
└── schema.ts

app/
├── (dashboard)/dashboard/editor/
│   ├── page.tsx
│   └── components/
│       ├── VisualEditor.tsx
│       ├── Sidebar.tsx
│       └── LivePreviewIframe.tsx
└── (storefront)/[subdomain]/
    └── page.tsx

components/storefront/
├── engine/
│   └── RenderEngine.tsx
└── universal-sections/
    ├── HeroSection.tsx
    ├── FeaturedProducts.tsx
    ├── PromoBanner.tsx
    └── Footer.tsx
```
