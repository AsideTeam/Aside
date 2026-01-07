export const formatUrl = (url: string): string => {
  const trimmed = url.trim()

  // Keep explicit schemes as-is (including internal pages like about:settings).
  // Note: about:/chrome: do not include "//".
  const explicitSchemes = ['http://', 'https://', 'file://', 'app://', 'aside://']
  for (const scheme of explicitSchemes) {
    if (trimmed.startsWith(scheme)) return trimmed
  }

  if (trimmed.startsWith('about:') || trimmed.startsWith('chrome:') || trimmed.startsWith('mailto:')) {
    return trimmed
  }

  // If user already typed some other scheme (e.g. custom), keep it.
  if (trimmed.includes('://')) return trimmed

  // Default: treat as a host/search and prefix https.
  return `https://${trimmed}`
};
