## 1. Setup & Tests

- [x] 1.1 Write a test in `__tests__/cms-pages.test.ts` that validates page schemas with HTML content containing lists, links, and bold text.
- [x] 1.2 Add the required Tiptap dependencies (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, and `@tiptap/extension-placeholder`) to `package.json` and install them.

## 2. Editor Styling & Base Styles

- [x] 2.1 Define custom `.prose` and `.ProseMirror` styling rules in `app/globals.css` that align with `DESIGN.md` tokens (no shadows, pill elements, Inter typography, custom headings, lists, blockquotes, and links).


## 3. Component Implementation

- [x] 3.1 Create a premium, responsive `RichTextEditor` client-side component (e.g. in `components/ui/primitives/RichTextEditor.tsx`) with a clean toolbar conforming to the pill-only, shadowless, and tailored colors guidelines of `DESIGN.md`.
- [x] 3.2 Implement a link insertion modal or tooltip input box in the toolbar that matches the design rules (pill input, no shadow).
- [x] 3.3 Add a status bar under the editor containing word and character counts.


## 4. Page Integration

- [x] 4.1 Update `PageForm` in `app/(dashboard)/dashboard/pages/components/page-form.tsx` to replace the `<textarea>` with the new `RichTextEditor` component, handling form binding with `@tanstack/react-form` smoothly.


## 5. Verification

- [x] 5.1 Run `vitest` to ensure the validation schemas and pages unit tests pass.
- [x] 5.2 Build the application or test the editor manually in the dashboard to ensure correct layout and clean storefront rendering.

