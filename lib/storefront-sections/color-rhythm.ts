/**
 * assignColorRhythm
 *
 * Automatically assigns a background rhythm value to a sequence of visible section keys.
 * This ensures that sections alternate colors without colliding when optional sections are hidden.
 *
 * @param visibleSectionKeys - Array of section keys that are currently visible on the storefront
 * @param rhythmPattern - Array of rhythm variants (e.g. ['light', 'dark', 'accent'])
 * @returns Record mapping sectionKey to assigned rhythm string
 */
export function assignColorRhythm(
  visibleSectionKeys: string[],
  rhythmPattern: string[] = ["light", "dark"]
): Record<string, string> {
  const rhythm: Record<string, string> = {}
  
  if (visibleSectionKeys.length === 0 || rhythmPattern.length === 0) {
    return rhythm
  }
  
  let patternIndex = 0
  
  for (let i = 0; i < visibleSectionKeys.length; i++) {
    const key = visibleSectionKeys[i]
    rhythm[key] = rhythmPattern[patternIndex]
    
    // Advance to next pattern, wrapping around
    patternIndex = (patternIndex + 1) % rhythmPattern.length
  }
  
  return rhythm
}
