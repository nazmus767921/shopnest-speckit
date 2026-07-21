# Quickstart: Storefront Architecture Refactor

**Feature**: 005-storefront-architecture-refactor

This guide details how to validate the new storefront architecture, specifically focusing on the new template scaffolding workflow and the layout/shell abstraction.

## Prerequisites
- The ShopNest local development environment running (`bun dev`).
- Access to the database to assign templates (or use the dashboard if UI exists).

## Scenario 1: Scaffold a New Template

This validates that the `scaffold:template` script correctly generates a template that fulfills the strict `defineTemplate` contract.

**Steps:**
1. Run the scaffold command from the project root:
   ```bash
   bun run scaffold:template midnight
   ```
2. Verify the output directory exists:
   ```bash
   ls templates/midnight
   ```
   *Expected:* You should see `index.ts`, `Shell.tsx`, `styles.css`, `DESIGN.md`, `components/`, and `__tests__/`.
3. Verify the contract test passes without any manual changes to the scaffolded code:
   ```bash
   bun test templates/__tests__/template-contract.test.ts
   ```
   *Expected:* The test suite iterates over all registered templates (including the new `midnight` one) and passes.
4. Verify the template's internal smoke tests pass:
   ```bash
   bun test templates/midnight/__tests__
   ```
   *Expected:* All smoke tests for the `midnight` template pass.

## Scenario 2: Validate Template Preview Mode

This validates the new preview mode detection in the layout.

**Steps:**
1. Log in to the application as a store owner.
2. Navigate to your storefront (e.g., `http://test-store.localhost:3000`).
3. Append the preview query parameter for the newly scaffolded template:
   ```text
   http://test-store.localhost:3000/?template_preview=midnight
   ```
4. **Verification:**
   - A floating "Preview Mode" banner should be visible on the screen.
   - The overall layout (Navbar/Footer) should reflect the `midnight` template's `Shell` component, not the live template's.
   - The CSS scoping class `.storefront-template-midnight` should be applied to the root element.

## Scenario 3: Verify the DAL Abstraction

This validates that the Data Access Layer correctly formats data and prevents crashes.

**Steps:**
1. Log in to the admin dashboard and create a new product with variants (e.g., Size: S, M).
2. Visit the storefront Product Listing Page (`/products`).
3. **Verification:**
   - The product should appear correctly in the grid.
   - The Next.js server logs for the `/products` route should show only the call to `getStorefrontContext()` or `getFormattedProducts()`, demonstrating the route page is thin.
4. Inject invalid JSONB into a `storefront_sections` row in the database (e.g., missing a required field).
5. Refresh the storefront homepage.
6. **Verification:**
   - The section should either render with default fallback data (via Zod defaults) or show the `SectionErrorBoundary` fallback.
   - The rest of the homepage MUST continue to render normally without a 500 Server Error.
