/**
 * Media Library Helpers
 */

/**
 * Calculates the new selection set when holding Shift during selection.
 * Finds all files between lastSelectedId and currentId in the visible list
 * and adds them to the selection.
 */
export function calculateShiftClickRange(
  visibleFileIds: string[],
  lastSelectedId: string | null,
  currentId: string,
  currentSelectedIds: Set<string>
): Set<string> {
  const nextSelected = new Set(currentSelectedIds)

  if (!lastSelectedId) {
    if (nextSelected.has(currentId)) {
      nextSelected.delete(currentId)
    } else {
      nextSelected.add(currentId)
    }
    return nextSelected
  }

  const startIdx = visibleFileIds.indexOf(lastSelectedId)
  const endIdx = visibleFileIds.indexOf(currentId)

  if (startIdx === -1 || endIdx === -1) {
    // If either file is not found (e.g. view changed), toggle current
    if (nextSelected.has(currentId)) {
      nextSelected.delete(currentId)
    } else {
      nextSelected.add(currentId)
    }
    return nextSelected
  }

  const minIdx = Math.min(startIdx, endIdx)
  const maxIdx = Math.max(startIdx, endIdx)

  // macOS style Shift selection:
  // Usually, it selects everything in the range. Let's add all items in the range.
  for (let i = minIdx; i <= maxIdx; i++) {
    nextSelected.add(visibleFileIds[i])
  }

  return nextSelected
}

/**
 * Validates a file for staging in the upload queue.
 * Checks MIME type against supported image formats (PNG, JPEG, WebP, SVG, GIF)
 * and verifies file size is within the allowed limit.
 */
export interface FileValidationResult {
  valid: boolean
  error?: string
}

export function validateFileForStaging(
  file: { name: string; size: number; type: string },
  maxSizeBytes: number
): FileValidationResult {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/gif"]
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type || "unknown"}). Only PNG, JPEG, WebP, SVG, and GIF are allowed.`
    }
  }

  if (file.size > maxSizeBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2)
    const limitMb = (maxSizeBytes / (1024 * 1024)).toFixed(2)
    return {
      valid: false,
      error: `File size (${sizeMb}MB) exceeds the current plan limit of ${limitMb}MB.`
    }
  }

  return { valid: true }
}
