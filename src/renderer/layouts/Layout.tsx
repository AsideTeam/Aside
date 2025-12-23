/**
 * ZenLayout
 *
 * Arc/Zen 브라우저 스타일 레이아웃
 * - 좌측 사이드바 (탭, 빠른 접근)
 * - 우측 WebContentsView 영역 (구멍 뚫린 자리)
 *
 * 아키텍처:
 * BrowserWindow (frame: false, vibrancy: sidebar)
 *   ├── React: Sidebar + ContentArea (div, 투명)
 *   └── WebContentsView (Electron Native, 자식 뷰)
 */

import React, { useEffect, useRef } from 'react';
import { Sidebar } from '../components/browser/Sidebar';
import { useViewBounds } from '@renderer/hooks/useViewBounds';
import { useWebContents } from '@renderer/hooks/useWebContents';
import { logger } from '@renderer/lib/logger';
import { tokens, cn } from '@renderer/styles';

export const ZenLayout: React.FC = () => {
  const contentAreaRef = useRef<HTMLDivElement | null>(null);
  const { updateBounds } = useViewBounds(contentAreaRef, {
    margin: 8, // Arc 스타일: 배경과 8px 여백
  });
  const { currentUrl } = useWebContents();

  // 마운트 및 리사이즈 시 bounds 업데이트
  useEffect(() => {
    logger.info('ZenLayout - Mounted');

    // 1. 초기 bounds 설정
    setTimeout(updateBounds, 100);

    // 2. 윈도우 리사이즈 시 업데이트
    window.addEventListener('resize', updateBounds);

    // 3. ResizeObserver: 사이드바 토글 등으로 div 크기 변화 감지
    const observer = new ResizeObserver(updateBounds);
    if (contentAreaRef.current) {
      observer.observe(contentAreaRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateBounds);
      observer.disconnect();
      logger.info('ZenLayout - Unmounted');
    };
  }, [updateBounds]);

  return (
    <div className={cn('aside-frame', tokens.colors.bg.primary, tokens.colors.text.primary)}>
      {/* 좌측: Sidebar (React UI) */}
      <Sidebar />

      {/* 우측: WebContentsView가 올라갈 "구멍" */}
      <main className="aside-view-container">
        <div ref={contentAreaRef} className="aside-view-placeholder" />

        <div className={cn('aside-url-hint', tokens.colors.text.secondary)}>
          {currentUrl}
        </div>
      </main>
    </div>
  );
};
