# Product Requirements Document: Admin Media Management

## 1. Overview
The goal is to build a comprehensive, high-performance Media Management library within an existing Next.js (App Router) project. This feature is heavily inspired by the `admin-kit-single-db` project but adapted to the host project's specific tech stack (Supabase Storage, shadcn/ui).

## 2. Tech Stack & Architecture
- **Framework**: Next.js (App Router)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Storage**: Supabase Storage (Buckets)
- **UI Components**: `shadcn/ui` + Tailwind CSS + Lucide React icons
- **State/Caching**: React state, SWR or Server Actions for data fetching
- **Authentication**: Existing project architecture (Better Auth implementation).

## 3. Database Schema (Drizzle ORM)
The agent must create the following tables using Drizzle ORM.

### `media_files` table:
- `id`: Text (Primary Key, default random UUID string)
- `url`: Text (Public URL of the file)
- `key`: Text (Unique storage key/path in Supabase bucket)
- `name`: Varchar(255)
- `size`: Integer (Bytes)
- `type`: Varchar(100) (MIME type e.g., 'image/png')
- `folder`: Varchar(100) (Default 'general')
- `uploadedById`: Text (Reference to user table)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `merchantId`: Text (Multi-tenant reference to merchants table)

### `media_folders` table:
- `id`: Text (Primary Key, default random UUID string)
- `name`: Varchar(255)
- `slug`: Varchar(255) (Unique)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `merchantId`: Text (Multi-tenant reference to merchants table)

*Note: Ensure both tables include `merchantId` indexes for multi-tenant isolation.*

## 4. Functional Requirements (FRs)

### FR1: File Upload Engine
- **Mechanism**: Implement a custom Dropzone using `react-dropzone`.
- **Upload Path**: Files must be uploaded **directly from the client browser to Supabase Storage** using the Supabase JS client (`supabase.storage.from('bucket').upload(...)`) to save server bandwidth.
- **Record Creation**: Once the upload to Supabase is successful, the client must trigger a Next.js Server Action to create the database record in `media_files` with the file metadata (size, type, url, key).

### FR2: File Browsing & Organization
- **Gallery View**: Support both Grid View (with Small, Medium, Large size toggles) and List View.
- **Sidebar**: A collapsible left sidebar for folder navigation (Mac-style visual directory navigator).
- **Default Folders**: System must seed default folders: "All Assets", "General", "Products", "Banners", and "Slides".
- **Pagination & Caching**: Implement pagination with state/caching logic for instant UI updates when navigating pages.

### FR3: Filtering, Sorting & Search
- **Search**: Debounced text search on the file `name`.
- **Type Filter**: Filter by All, Image, PDF, Video, Other.
- **Sorting**: Newest/Oldest Uploaded, Name A-Z/Z-A, Size Largest/Smallest.

### FR4: Folder Management & Drag-and-Drop
- **Create/Delete Folders**: Users can create custom folders. Deleting a custom folder must NOT delete the files inside; it should optimistically relocate the contained files back to the "general" folder.
- **Drag & Drop Move**: Users must be able to drag a file (or multiple selected files) and drop them onto a folder in the sidebar to move them.

### FR5: Bulk Actions & Select Mode
- **Select Mode**: A toggleable mode to select multiple files. (Support Shift+Click for range selection).
- **Bulk Delete**: Delete multiple files from both the Supabase Storage bucket and the database simultaneously.
- **Bulk Move**: Move multiple selected files to a different folder.

### FR6: File Metadata Editing & Context Menu
- **Context Menu**: Right-clicking a file card should open a context menu.
- **Edit Details**: Ability to rename a file's display name and change its associated folder.
- **Copy Link**: Ability to copy the public Supabase Storage URL to the clipboard.

## 5. UI / UX Specifications
- **Components**: Replace the original custom `@repo/ui` imports with local `shadcn/ui` imports (e.g., `@/components/ui/button`, `@/components/ui/dialog`, `@/components/ui/input`, `@/components/ui/sheet`, etc.).
- **Optimistic UI**: Moving, renaming, or deleting files should instantly update the UI state while the server action processes in the background.
- **Icons**: ALL icons MUST be imported from `@/lib/icons`, never directly from `lucide-react`. If missing, add to `@/lib/icons` first.

## 6. Security & Authorization
- **Tenant Isolation**: ALL Server Actions and database queries MUST filter by the current `merchantId`.
- **Auth Implementation**: The agent should rely on the host project's existing authentication architecture (Better Auth) to retrieve the current session and `merchantId`.

## 7. Implementation Directives for the Agent
When executing this PRD, the Antigravity agent should:
1. Create the Drizzle schema files and run migrations.
2. Build the Server Actions (`actions/media.ts`) for CRUD operations on files and folders.
3. Build the UI Components: `MediaLibraryClient`, `MediaCard`, and `CustomUploadDropzone`.
4. Assemble the page at `app/(dashboard)/media/page.tsx` (or equivalent route in the host project).
