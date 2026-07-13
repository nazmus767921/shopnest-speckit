## Context

ShopNest merchants need a way to upload and organize images. We are building a Media Management Library UI that stores metadata in our Drizzle PostgreSQL database and uploads the physical image files to a Supabase Storage bucket called "media". The UI will be accessible under the `app/(dashboard)/media` route in the admin panel. 

## Goals / Non-Goals

**Goals:**
- Provide a drag-and-drop file upload zone.
- Manage hierarchical folders and file metadata (move, rename, delete) via Next.js Server Actions.
- Ensure strict multi-tenant isolation so merchants only see their own files.
- Enable direct-to-storage file uploads to save server bandwidth.

**Non-Goals:**
- Image manipulation (cropping, resizing) in the dashboard (to be handled externally or via CDN transformations if needed).
- Granular file permissions per staff member (all merchant staff can access the merchant's media).

## Decisions

- **Direct Uploads**: We will use the Supabase JS client (`@supabase/supabase-js`) on the client side to upload files directly to the "media" bucket. Once the upload resolves, the client calls a Next.js Server Action to insert the metadata record into PostgreSQL. *Alternative*: Uploading through a Route Handler, but this wastes server bandwidth and Vercel execution time.
- **Metadata Storage**: Metadata is stored in Drizzle (`media_files` and `media_folders`) with a `merchantId` column. *Alternative*: Storing metadata only in Supabase Storage tags, but PostgreSQL allows for much faster querying, relational integrity, and standard RBAC/RLS integration.
- **Caching Strategy**: Given Next.js 16 caching defaults, Server Actions will mutate the database and call `revalidatePath('/media')` or `revalidateTag('media')`. The `app/(dashboard)/media/page.tsx` will fetch data dynamically (using `await connection()`, `<Suspense>`, and omitting `"use cache"` or strictly passing primitives). 
- **Icons**: Following project rules (`AGENTS.md`), all icons will be imported from `@/lib/icons`, ensuring a single source of truth.
- **UI Design**: The UI will adhere to `DESIGN.md` rules (pill-only buttons, specific typography, and no shadows for a flat aesthetic).

## Risks / Trade-offs

- **[Risk] Orphaned Files**: If the direct upload succeeds but the subsequent Server Action fails, a file exists in the bucket without a DB record. 
  - *Mitigation*: We could implement a periodic cron job to reconcile the bucket with the DB, or accept a minor storage leak since storage is cheap. For v1, we accept the minor risk.
- **[Risk] Security**: Malicious users might try to upload huge files directly if bucket policies aren't strict. 
  - *Mitigation*: Configure Supabase Storage Bucket limits and validate the image size on the server action against the merchant's `snapshotImageSizeMb` limit to ensure authenticated uploads only and respect subscription limits.
