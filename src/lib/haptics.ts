/**
 * Mobile Haptic Feedback and Native Interaction Utilities
 */

/**
 * Trigger a light haptic tap feedback (10ms)
 */
export function vibrateTap(): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(10)
    } catch {
      // Ignore if not supported or blocked by user gesture policy
    }
  }
}

/**
 * Trigger a success haptic pattern (two quick pulses)
 */
export function vibrateSuccess(): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([15, 50, 20])
    } catch {
      // Ignore
    }
  }
}

/**
 * Trigger a warning or error haptic pattern
 */
export function vibrateWarning(): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([30, 40, 30])
    } catch {
      // Ignore
    }
  }
}

/**
 * Safely read text from system clipboard with fallback
 */
export async function readClipboardText(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText()
      return text ? text.trim() : null
    }
  } catch (err) {
    console.warn("Clipboard read permission denied or unavailable:", err)
  }
  return null
}
