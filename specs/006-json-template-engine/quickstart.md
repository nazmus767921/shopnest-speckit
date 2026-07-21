# Quickstart: json-template-engine Validation

## Prerequisites
- Supabase local instance running (`npx supabase start`)
- Node modules installed (`bun install`)
- Dev server running (`bun dev`)

## Validation Scenarios

### Scenario 1: Verify Dashboard Editor Loads
1. Open the browser to the merchant dashboard `app.localhost:3000/dashboard/editor`.
2. **Expected Outcome**: The page should display a visual editor with a left sidebar for sections and a main iframe pointing to the live storefront preview.

### Scenario 2: Verify Live Preview Syncs via postMessage
1. In the left sidebar of the editor, add a new "Hero" section or drag an existing one.
2. **Expected Outcome**: The preview iframe should instantly update to reflect the new layout without a full page reload.

### Scenario 3: Verify Persistence
1. After modifying the layout in the editor, click the "Save" button.
2. Open a new tab to the public storefront URL (e.g. `merchant-subdomain.localhost:3000`).
3. **Expected Outcome**: The public storefront should accurately parse the JSON layout from the database and render the new changes.
