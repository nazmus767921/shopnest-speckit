## Why

Merchants currently lack a central way to upload, manage, and select media assets (images only) for their products, pages, and storefront customization. Providing a robust media management library with direct Supabase Storage uploads and hierarchical folder organization solves this, enabling better asset reuse and a smoother store configuration experience.

## What Changes

- Implement a custom, drag-and-drop enabled file upload mechanism directly to Supabase Storage.
- Create metadata tracking in PostgreSQL (`media_files` and `media_folders` tables) with multi-tenant isolation via Better Auth's `merchantId`.
- Build a comprehensive Media Library UI in the admin dashboard (Mac-style visual directory navigator, grid/list toggles).
- Add folder management (create, delete, drag-and-drop move) and file context menus (rename, move, copy link, bulk delete).

## Capabilities

### New Capabilities
- `media-management`: Core capabilities covering direct Supabase file uploads, folder-based hierarchical organization, metadata tracking in PostgreSQL, and a drag-and-drop capable admin UI library for managing merchant assets.

### Modified Capabilities

## Impact

- **Database**: Adds `media_files` and `media_folders` tables to the Drizzle schema.
- **Storage**: Requires proper configuration of a Supabase Storage bucket named "media" with appropriate permissions.
- **UI/Routing**: Introduces a new `/media` route inside the `app/(dashboard)` admin layout and new components in `components/media/`.
- **API**: Adds Server Actions in `app/actions/media.ts` for file and folder CRUD operations.
