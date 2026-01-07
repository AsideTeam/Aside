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
  const isDragging = useOverlayStore((s) => s.isDragging)

  const updateBounds = useCallback(
    (explicitOffsets?: { left: number; top: number }) => {
      if (isDragging) return

      if (!contentAreaRef.current || !window.electronAPI?.view) return

      try {
        const rect = contentAreaRef.current.getBoundingClientRect()

        const left = explicitOffsets ? explicitOffsets.left : rect.x
        const top = explicitOffsets ? explicitOffsets.top : rect.y

        const newBounds: ViewBounds = {
          left: Math.round((left + margins.left) * scaleFactor),
          top: Math.round((top + margins.top) * scaleFactor),
        }

        if (!lastBoundsRef.current || !areBoundsEqual(lastBoundsRef.current, newBounds)) {
          const parsed = ViewResizeSchema.safeParse(newBounds)
          if (!parsed.success) return

          window.electronAPI.view.resize(parsed.data)
          lastBoundsRef.current = newBounds
        }
      } catch (error) {
        logger.error('useViewBounds - Error updating bounds', { error })
      }
    },
    [contentAreaRef, scaleFactor, margins.left, margins.top, isDragging]
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
