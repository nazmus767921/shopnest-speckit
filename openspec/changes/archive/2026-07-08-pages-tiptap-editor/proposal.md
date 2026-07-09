## Why

Merchants currently edit standard page content using a plain HTML `<textarea>` element. This requires them to write raw HTML tags directly, which is error-prone, unintuitive, and hampers the merchant experience. We want to provide a modern, premium WYSIWYG rich text editor (Tiptap) in the merchant dashboard.

## What Changes

- Replace the plain HTML `<textarea>` in the Page Form with a custom, premium Tiptap rich text editor.
- Implement a styled formatting toolbar (headings, bold/italic/strikethrough text, bullet/ordered lists, blockquotes, links, and undo/redo).
- Define custom, responsive styling in the global CSS to ensure standard page elements (headers, lists, links, blockquotes) render correctly and beautifully in both the editor and the storefront, adhering to `DESIGN.md` tokens.
- Add character and word count status under the editor.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `cms-standard-pages`: Update merchant editing requirements to specify a WYSIWYG rich text editor interface rather than raw HTML inputs.

## Impact

- **UI Components**: Create a new `RichTextEditor` component using Tiptap.
- **Pages Module**: Update `PageForm` in [page-form.tsx](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/(dashboard)/dashboard/pages/components/page-form.tsx) to use the new `RichTextEditor` component instead of `textarea`.
- **CSS**: Append `.prose` and `.ProseMirror` styling definitions to [globals.css](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/globals.css).
- **Dependencies**: Add `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, and `@tiptap/extension-placeholder` to package.json.
