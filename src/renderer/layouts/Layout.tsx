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
    <div className="flex h-screen w-full bg-gray-950 text-white overflow-hidden">
      {/* ===== 좌측: 사이드바 ===== */}
      <aside className={tokens.layout.sidebar.wrapper}>
        <Sidebar />
      </aside>

      {/* ===== 우측: 컨텐츠 영역 ===== */}
      <main className={tokens.layout.contentArea.wrapper}>
        <div
          ref={contentAreaRef}
          className={tokens.layout.contentArea.placeholder}
        />

        {/* 로딩 상태 표시기 (선택사항) */}
        <div className={cn(tokens.colors.text.tertiary, 'absolute top-4 right-4 z-40 text-xs')}>
          {currentUrl}
        </div>
      </main>
    </div>
  );
};
