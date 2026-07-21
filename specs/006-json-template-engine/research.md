# Phase 0: Research - json-template-engine

## Decisions

### Decision 1: Iframe Preview Communication
- **Decision**: Use `window.postMessage` to communicate between the dashboard editor and the storefront iframe, passing the updated JSON layout on every edit.
- **Rationale**: This is the industry standard for live-preview editors (like Shopify and Builder.io) because it avoids saving to the database or reloading the page on every keystroke, keeping the preview instantaneous. The storefront must listen for these messages only when `?preview=true` is present in the URL.
- **Alternatives considered**: Saving to the database on every change and using React Server Components to re-render (too slow), or using WebSockets (overkill for local preview).

### Decision 2: JSON Structure
- **Decision**: Follow a flat structure inside `active_layout` for sections, similar to Shopify's `blocks`.
  ```json
  [
    {
      "id": "uuid",
      "type": "hero",
      "settings": { "headline": "Welcome" }
    }
  ]
  ```
- **Rationale**: Flat arrays are easier to reorder using drag-and-drop libraries (e.g., `dnd-kit` or standard HTML5 DnD) than deeply nested trees.
- **Alternatives considered**: Nested trees (too complex for a simple storefront).

### Decision 3: Drag and Drop Library
- **Decision**: Use `@dnd-kit/core` and `@dnd-kit/sortable` if a library is needed, otherwise stick to standard HTML5 drag-and-drop for simplicity. Since we prefer Shadcn UI, we will check if any existing accessible primitives can be used, else HTML5 is preferred to minimize bundle size.
- **Rationale**: Standard HTML5 drag and drop is often sufficient for simple vertical lists and avoids heavy dependencies.

### Decision 4: Global CSS Variables
- **Decision**: Store the base CSS variables in the `themes` table as JSON. In the root layout of the storefront, render a `<style>` tag that injects these variables into the `:root`.
- **Rationale**: This allows for dynamic theming per merchant without requiring a CSS recompilation.
