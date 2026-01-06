/**
 * Favicon utility functions
 * Arc-style high-resolution favicon strategy
 */

/**
 * Get favicon URL with fallback strategy
 * 1. Use real favicon from page if available
 * 2. Fall back to Google Favicon Service (64px for Retina display)
 * 3. Fall back to default globe icon
 */
export function getFaviconUrl(pageUrl: string, realFavicon?: string): string {
  // Priority 1: Real favicon from page-favicon-updated event
  if (realFavicon) {
    return realFavicon
  }

  // Priority 2: Google Favicon Service (handles most websites)
  try {
    const domain = new URL(pageUrl).hostname
    // sz=64 for high-resolution Retina display
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    // Priority 3: Invalid URL, use default
    return ''
  }
}

/**
 * Get domain from URL for display
 */
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
