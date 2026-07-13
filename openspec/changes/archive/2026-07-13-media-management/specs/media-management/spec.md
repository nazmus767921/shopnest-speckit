## ADDED Requirements

### Requirement: Upload Media File
The system SHALL allow merchants to upload image files directly to Supabase Storage, bypassing the Next.js server to save bandwidth, and then store the file metadata in PostgreSQL.

#### Scenario: Successful File Upload
- **WHEN** a merchant selects a file and drops it into the CustomUploadDropzone
- **THEN** the file is uploaded to the "media" Supabase bucket using the merchant's context
- **THEN** a Server Action is triggered to insert a record into the `media_files` table with the correct `merchantId` and file metadata (url, key, name, size, type).

### Requirement: Subscription Size Limit
The system SHALL reject any image upload where the file size exceeds the merchant's `snapshotImageSizeMb` limit defined in their active subscription plan.

#### Scenario: Upload Exceeds Limit
- **WHEN** a merchant attempts to upload an image larger than their `snapshotImageSizeMb` limit
- **THEN** the upload is blocked or fails validation, and the system displays an error message indicating the size limit.

### Requirement: Folder Navigation and File Browsing
The system SHALL provide a file browsing interface that supports both a grid and list view, along with a sidebar for hierarchical folder navigation.

#### Scenario: Navigate to a Custom Folder
- **WHEN** a merchant clicks on a folder in the sidebar (e.g., "Banners")
- **THEN** the main gallery view updates to show only files associated with that folder
- **THEN** the UI reflects the current active folder state.

### Requirement: File Metadata Editing
The system SHALL allow merchants to edit a file's display name and change its associated folder via a context menu.

#### Scenario: Rename a File
- **WHEN** a merchant right-clicks a file card and selects "Rename", enters a new name, and saves
- **THEN** the `media_files.name` record is updated in the database and the UI reflects the new name optimistically.

### Requirement: Bulk File Management
The system SHALL support selecting multiple files to move them to a different folder or delete them simultaneously.

#### Scenario: Bulk Move Files
- **WHEN** a merchant selects multiple files, right-clicks, and selects "Move to Folder", then chooses a destination
- **THEN** all selected files have their `folder` attribute updated to the new destination in the database.

### Requirement: Folder Management
The system SHALL allow merchants to create and delete custom folders. Deleting a custom folder MUST NOT delete the files inside; it SHALL relocate the contained files back to the "General" folder.

#### Scenario: Delete a Custom Folder
- **WHEN** a merchant deletes a custom folder containing files
- **THEN** the folder is removed from the `media_folders` table
- **THEN** all files previously inside that folder are optimistically reassigned to the "General" folder.

### Requirement: Tenant Isolation
The system SHALL enforce strict multi-tenant isolation, ensuring that a merchant can only access or modify files and folders associated with their `merchantId`.

#### Scenario: Prevent Cross-Tenant Access
- **WHEN** a request is made to list, update, or delete a media file or folder
- **THEN** the server action MUST verify the user's session via Better Auth and filter the database query using the authenticated user's `merchantId`.
