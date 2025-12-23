/**
 * useViewBounds Hook
 *
 * 책임: ContentArea(WebContentsView가 들어갈 자리)의 크기/위치를 계산해서
 *      Main Process에 IPC로 전송
 *
 * 사용 예:
 *   const { updateBounds } = useViewBounds(contentAreaRef);
 *   
 *   useEffect(() => {
 *     updateBounds();
 *     window.addEventListener('resize', updateBounds);
 *   }, []);
 */

import { useCallback, useRef } from 'react';
import { logger } from '../lib/logger';
import type { ViewBounds } from '@shared/types/view';
import { ViewResizeSchema } from '@shared/validation/schemas'

type Margins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

interface UseViewBoundsOptions {
  margin?: number | Partial<Margins>; // 배경과의 여백 (Arc 스타일)
  scaleFactor?: number; // 고급 옵션 (기본값: 1). 보통 Electron setBounds는 DIP 기준이므로 1이 안전
}

export const useViewBounds = (
  contentAreaRef: React.RefObject<HTMLDivElement | null>,
  options: UseViewBoundsOptions = {}
) => {
  // NOTE: getBoundingClientRect()는 CSS px(DIP) 기반.
  // Electron WebContentsView.setBounds 역시 DIP 기준이므로 기본 1을 사용.
  const { margin = 0, scaleFactor = 1 } = options;
  const margins = normalizeMargins(margin);
  const lastBoundsRef = useRef<ViewBounds | null>(null);

  const updateBounds = useCallback(() => {
    if (!contentAreaRef.current || !window.electronAPI?.view) {
      logger.warn('useViewBounds - contentAreaRef or electronAPI.view not available');
      return;
    }

    try {
      const rect = contentAreaRef.current.getBoundingClientRect();

      // Safe-area 오프셋만 계산 (pinned sidebar/header 크기)
      const newBounds: ViewBounds = {
        left: Math.round(rect.x * scaleFactor),
        top: Math.round(rect.y * scaleFactor),
      };

      // 이전과 다를 때만 업데이트 (성능 최적화)
      if (!lastBoundsRef.current || !areBoundsEqual(lastBoundsRef.current, newBounds)) {
        const parsed = ViewResizeSchema.safeParse(newBounds)
        if (!parsed.success) {
          logger.warn('useViewBounds - Invalid bounds; skip resize')
          return
        }
        logger.info('[📐 RENDERER → MAIN] Sending safe-area offsets:', {
          left: newBounds.left,
          top: newBounds.top,
        });
        window.electronAPI.view.resize(parsed.data);
        lastBoundsRef.current = newBounds;
      }
    } catch (error) {
      logger.error('useViewBounds - Error updating bounds', { error });
    }
  }, [contentAreaRef, margin, margins.bottom, margins.left, margins.right, margins.top, scaleFactor]);

  return { updateBounds };
};

/**
 * ViewBounds 비교 함수
 */
function areBoundsEqual(bounds1: ViewBounds, bounds2: ViewBounds): boolean {
  return (
    bounds1.left === bounds2.left &&
    bounds1.top === bounds2.top
  );
}

function normalizeMargins(margin: number | Partial<Margins>): Margins {
  if (typeof margin === 'number') {
    return { top: margin, right: margin, bottom: margin, left: margin };
  }

  return {
    top: margin.top ?? 0,
    right: margin.right ?? 0,
    bottom: margin.bottom ?? 0,
    left: margin.left ?? 0,
  };
}
