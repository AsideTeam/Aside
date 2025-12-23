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
import { AsideHeader } from '../components/browser/AsideHeader';
import { cn, tokens } from '@renderer/styles';
import { useWindowFocus, useOverlayInteraction } from '@renderer/hooks';
import { useOverlayStore } from '@renderer/lib/overlayStore';

export const ZenLayout: React.FC = () => {
  const isFocused = useWindowFocus();
  const headerOpen = useOverlayStore((s) => s.headerOpen)
  const sidebarOpen = useOverlayStore((s) => s.sidebarOpen)

  useOverlayInteraction();

  useEffect(() => {
    document.documentElement.classList.add('aside-overlay-mode');
    return () => {
      document.documentElement.classList.remove('aside-overlay-mode');
    };
  }, []);

  return (
    <div
      className={cn(
        'aside-overlay',
        isFocused ? 'aside-window-focused' : 'aside-window-blurred',
        headerOpen ? 'aside-overlay--header-open' : '',
        sidebarOpen ? 'aside-overlay--sidebar-open' : '',
        tokens.colors.text.primary,
      )}
    >
      {/* Hit-test zones (Ghost 모드에서 elementFromPoint로 감지) */}
      <div className="aside-hit-zone aside-hit-zone--header" data-overlay-zone="header" />
      <div className="aside-hit-zone aside-hit-zone--sidebar" data-overlay-zone="sidebar" />

      <AsideHeader />
      <Sidebar />
    </div>
  );
};
