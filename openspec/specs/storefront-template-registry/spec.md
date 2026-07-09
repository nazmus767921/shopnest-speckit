# storefront-template-registry

## Purpose
This capability defines the core template module architecture — the registry, data contract interfaces, template resolution logic, and the thin resolver page pattern that enables multiple storefront templates to coexist.

## Requirements

### Requirement: Template Module Data Contract
The system MUST define a `TemplateModule` TypeScript interface that every template module implements. The interface SHALL export named components: `HomePage`, `PLP`, `PDP`, `CartPage`, `Navbar`, and `Footer`. Each component SHALL accept a strictly typed props interface that is identical across all templates.

#### Scenario: Adding a new template module
- **WHEN** a developer creates a new template folder under `templates/<name>/`
- **THEN** the module MUST export all components defined in the `TemplateModule` interface, and TypeScript compilation SHALL fail if any component is missing or has incorrect prop types.

### Requirement: Template Registry
The system MUST maintain a `templates/registry.ts` module that maps template slug strings to their corresponding `TemplateModule` implementations. The registry MUST be statically imported at build time.

#### Scenario: Resolving a valid template slug
- **WHEN** the system calls `getTemplate("fashion")`
- **THEN** the registry returns the fashion template module with all its page components.

#### Scenario: Resolving an unknown template slug
- **WHEN** the system calls `getTemplate("nonexistent")`
- **THEN** the registry returns the default template module (the one marked `is_default` in the DB, typically `"general"`).

### Requirement: Thin Resolver Page Pattern
Each storefront route page (`page.tsx`) MUST act as a thin resolver that (1) reads the merchant's template slug from request headers, (2) resolves the template module from the registry, (3) fetches page-specific data, and (4) renders the template's corresponding page component with the fetched data as props.

#### Scenario: Rendering storefront home page
- **WHEN** a customer visits a merchant's storefront home page
- **THEN** the route resolver reads the template slug from the `x-merchant-template` header (or resolves it from the merchant record), gets the matching template module, fetches home page data, and renders `<template.HomePage store={store} data={data} />`.

### Requirement: Template Layout Resolution
The storefront layout (`layout.tsx`) MUST resolve the merchant's template and render the corresponding `Navbar` and `Footer` components from the template module, wrapping the page children.

#### Scenario: Storefront layout renders template-specific navbar and footer
- **WHEN** a customer navigates any page on a merchant's storefront
- **THEN** the layout renders the active template's `Navbar` component above the page content and the active template's `Footer` component below it.

### Requirement: Shared Page Exemption
Cart, Checkout, and Order pages MUST NOT be template-specific. These pages SHALL use a single shared implementation across all templates, with visual differences driven solely by CSS custom properties set by the template's stylesheet.

#### Scenario: Cart page renders identically regardless of template
- **WHEN** a customer visits the cart page on a store using the "fashion" template
- **THEN** the cart page uses the same React component as a store using the "general" template, with only color, font, and radius differences applied through CSS tokens.

### Requirement: Per-Template CSS Isolation
Each template MUST define its own CSS custom properties (colors, fonts, radii, spacing) scoped under a `.storefront-template-<slug>` wrapper class. Template styles MUST NOT leak into non-storefront areas (dashboard, admin, marketing pages).

#### Scenario: Template CSS scoping
- **WHEN** the storefront layout renders with the "fashion" template
- **THEN** the outer wrapper element receives the class `storefront-template-fashion`, and all CSS custom properties within that scope resolve to the fashion template's design tokens.

### Requirement: Per-Template DESIGN.md Files
The system MUST maintain a `designmd/` directory at the project root containing `DESIGN-<template_name>.md` files for each template. Each file SHALL define the complete visual specification (colors, typography, spacing, component tokens, do's/don'ts) for that template. Agents implementing template components MUST reference the corresponding DESIGN file.

#### Scenario: Agent implements fashion template component
- **WHEN** an agent creates or modifies a component in `templates/fashion/`
- **THEN** the agent reads `designmd/DESIGN-fashion.md` to determine the correct colors, fonts, spacing, radii, and component styles to apply.
