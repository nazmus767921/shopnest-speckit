## 1. Database Schema & Migrations

- [x] 1.1 Write tests for media schema rules (merchantId isolation)
- [x] 1.2 Add `media_files` and `media_folders` to `db/schema.ts`
- [x] 1.3 Generate and push Drizzle migrations

## 2. Server Actions

- [x] 2.1 Write integration tests for media server actions (testing merchantId filtering)
- [x] 2.2 Implement `createMediaFileAction` in `app/actions/media.ts` (include `snapshotImageSizeMb` validation)
- [x] 2.3 Implement folder actions (`createFolderAction`, `deleteFolderAction`)
- [x] 2.4 Implement file modification actions (`renameMediaFileAction`, `moveMediaFilesAction`, `deleteMediaFilesAction`)

## 3. UI Components

- [x] 3.1 Create `CustomUploadDropzone.tsx` component
- [x] 3.2 Create `MediaCard.tsx` component with context menu
- [x] 3.3 Create `MediaSidebar.tsx` component for folder navigation
- [x] 3.4 Create the main `MediaLibraryClient.tsx` combining the above

## 4. Pages and Routing

- [x] 4.1 Create `app/(dashboard)/media/page.tsx` rendering `MediaLibraryClient`
- [x] 4.2 Verify Next.js caching strategy (passing primitives, `<Suspense>`)
- [x] 4.3 Add the "Media" link to the dashboard sidebar/navigation
