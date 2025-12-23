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

      // 새로운 bounds 계산
      const width = rect.width - margins.left - margins.right;
      const height = rect.height - margins.top - margins.bottom;

      const newBounds: ViewBounds = {
        x: Math.round((rect.x + margins.left) * scaleFactor),
        y: Math.round((rect.y + margins.top) * scaleFactor),
        width: Math.max(0, Math.round(width * scaleFactor)),
        height: Math.max(0, Math.round(height * scaleFactor)),
        margin: typeof margin === 'number' ? margin : 0,
      };

      // 이전과 다를 때만 업데이트 (성능 최적화)
      if (!lastBoundsRef.current || !areBoundsEqual(lastBoundsRef.current, newBounds)) {
        logger.info('useViewBounds - Updating view bounds', { bounds: newBounds });
        window.electronAPI.view.resize(newBounds);
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
    bounds1.x === bounds2.x &&
    bounds1.y === bounds2.y &&
    bounds1.width === bounds2.width &&
    bounds1.height === bounds2.height &&
    (bounds1.margin ?? 0) === (bounds2.margin ?? 0)
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
