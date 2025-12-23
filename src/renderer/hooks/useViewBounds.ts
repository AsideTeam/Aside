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

interface UseViewBoundsOptions {
  margin?: number; // 배경과의 여백 (Arc 스타일)
  scaleFactor?: number; // DPI 배율 (기본값: window.devicePixelRatio)
}

export const useViewBounds = (
  contentAreaRef: React.RefObject<HTMLDivElement | null>,
  options: UseViewBoundsOptions = {}
) => {
  const { margin = 0, scaleFactor = window.devicePixelRatio } = options;
  const lastBoundsRef = useRef<ViewBounds | null>(null);

  const updateBounds = useCallback(() => {
    if (!contentAreaRef.current || !window.electronAPI?.view) {
      logger.warn('useViewBounds - contentAreaRef or electronAPI.view not available');
      return;
    }

    try {
      const rect = contentAreaRef.current.getBoundingClientRect();

      // 새로운 bounds 계산
      const newBounds: ViewBounds = {
        x: Math.round((rect.x + margin) * scaleFactor),
        y: Math.round((rect.y + margin) * scaleFactor),
        width: Math.round((rect.width - margin * 2) * scaleFactor),
        height: Math.round((rect.height - margin * 2) * scaleFactor),
        margin,
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
  }, [contentAreaRef, margin, scaleFactor]);

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
