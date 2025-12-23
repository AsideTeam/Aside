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

import React, { useEffect } from 'react';
import { Sidebar } from '../components/browser/Sidebar';
import { cn, tokens } from '@renderer/styles';

export const ZenLayout: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.add('aside-overlay-mode');
    return () => {
      document.documentElement.classList.remove('aside-overlay-mode');
    };
  }, []);

  return (
    <div className={cn('aside-overlay', tokens.colors.text.primary)}>
      <Sidebar />
    </div>
  );
};
