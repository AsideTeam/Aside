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
import { useViewBounds } from '../hooks/useViewBounds';
import { useWebContents } from '../hooks/useWebContents';
import { logger } from '../lib/logger';

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
      <aside className="w-64 flex-none flex flex-col border-r border-gray-800 z-50">
        <Sidebar />
      </aside>

      {/* ===== 우측: 컨텐츠 영역 ===== */}
      {/* 
        이 div이 WebContentsView가 들어갈 자리입니다.
        - React는 투명한 div를 그림
        - Main Process의 WebContentsView가 이 좌표에 렌더링됨
        - 사용자 입장에서는 WebContentsView가 떠있는 것처럼 보임
      */}
      <main className="flex-1 relative bg-black overflow-hidden">
        <div
          ref={contentAreaRef}
          className="w-full h-full bg-transparent"
          style={{
            // 개발 모드: ContentArea 경계를 시각화 (나중에 제거)
            // border: '1px dashed rgba(255,0,0,0.3)',
          }}
        />

        {/* 로딩 상태 표시기 (선택사항) */}
        <div className="absolute top-4 right-4 z-40 text-xs text-gray-500">
          {currentUrl}
        </div>
      </main>
    </div>
  );
};
