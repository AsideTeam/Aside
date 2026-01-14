/**
 * useViewBounds Hook
 *
 * 책임: ContentArea(WebContentsView가 들어갈 자리)의 크기/위치를 계산해서
 *      Main Process에 IPC로 전송
 */

import { useCallback, useRef } from 'react'
import { logger } from '@renderer/lib/logger'
import type { ViewBounds } from '@shared/types/view'
import { ViewResizeSchema } from '@shared/validation/schemas'
import { useOverlayStore } from '@renderer/lib/overlayStore'

type Margins = {
  top: number
  right: number
  bottom: number
  left: number
}

interface UseViewBoundsOptions {
  margin?: number | Partial<Margins>
  scaleFactor?: number
}

export const useViewBounds = (
  contentAreaRef: React.RefObject<HTMLDivElement | null>,
  options: UseViewBoundsOptions = {}
) => {
  const { margin = 0, scaleFactor = 1 } = options
  const margins = normalizeMargins(margin)
  const lastBoundsRef = useRef<ViewBounds | null>(null)
  const pendingOffsetsRef = useRef<{ left: number; top: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const isDragging = useOverlayStore((s) => s.isDragging)

  const flush = useCallback(() => {
    rafRef.current = null
    if (isDragging) return
    if (!window.electronAPI?.view) return

    const explicitOffsets = pendingOffsetsRef.current
    pendingOffsetsRef.current = null

    try {
      let left: number
      let top: number

      if (explicitOffsets) {
        // Fast path: caller already measured offsets; avoid forced layout read.
        left = explicitOffsets.left
        top = explicitOffsets.top
      } else {
        const el = contentAreaRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        left = rect.x
        top = rect.y
      }

      const nextBounds: ViewBounds = {
        left: Math.round((left + margins.left) * scaleFactor),
        top: Math.round((top + margins.top) * scaleFactor),
      }

      if (lastBoundsRef.current && areBoundsEqual(lastBoundsRef.current, nextBounds)) return

      const parsed = ViewResizeSchema.safeParse(nextBounds)
      if (!parsed.success) return

      window.electronAPI.view.resize(parsed.data)
      lastBoundsRef.current = nextBounds
    } catch (error) {
      logger.error('useViewBounds - Error updating bounds', { error })
    }
  }, [contentAreaRef, isDragging, margins.left, margins.top, scaleFactor])

  const updateBounds = useCallback(
    (explicitOffsets?: { left: number; top: number }) => {
      if (isDragging) return
      if (!window.electronAPI?.view) return

      // Coalesce multiple calls within the same frame.
      if (explicitOffsets) pendingOffsetsRef.current = explicitOffsets
      if (rafRef.current != null) return
      rafRef.current = window.requestAnimationFrame(() => flush())
    },
    [flush, isDragging]
  )

  return { updateBounds }
}

function areBoundsEqual(bounds1: ViewBounds, bounds2: ViewBounds): boolean {
  return bounds1.left === bounds2.left && bounds1.top === bounds2.top
}

function normalizeMargins(margin: number | Partial<Margins>): Margins {
  if (typeof margin === 'number') {
    return { top: margin, right: margin, bottom: margin, left: margin }
  }

  return {
    top: margin.top ?? 0,
    right: margin.right ?? 0,
    bottom: margin.bottom ?? 0,
    left: margin.left ?? 0,
  }
}
