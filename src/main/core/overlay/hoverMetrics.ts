import type { OverlayHoverMetrics } from './types'

type MergeResult =
  | { kind: 'invalid' }
  | { kind: 'initial'; next: OverlayHoverMetrics }
  | { kind: 'update'; next: OverlayHoverMetrics }

export function mergeHoverMetrics(
  current: OverlayHoverMetrics | null,
  incoming: OverlayHoverMetrics
): MergeResult {
  if (!Number.isFinite(incoming.dpr) || incoming.dpr <= 0 || !Number.isFinite(incoming.timestamp)) {
    return { kind: 'invalid' }
  }

  if (!current) {
    return {
      kind: 'initial',
      next: { ...incoming, timestamp: incoming.timestamp || Date.now() },
    }
  }

  const next: OverlayHoverMetrics = { ...current }

  if (incoming.sidebarRightPx !== undefined && Number.isFinite(incoming.sidebarRightPx)) {
    next.sidebarRightPx = Math.max(0, incoming.sidebarRightPx)
  }

  if (incoming.headerBottomPx !== undefined && Number.isFinite(incoming.headerBottomPx)) {
    next.headerBottomPx = Math.max(0, incoming.headerBottomPx)
  }

  if (incoming.titlebarHeightPx !== undefined && Number.isFinite(incoming.titlebarHeightPx)) {
    next.titlebarHeightPx = Math.max(0, incoming.titlebarHeightPx)
  }

  next.dpr = incoming.dpr
  next.timestamp = incoming.timestamp || Date.now()

  return { kind: 'update', next }
}
