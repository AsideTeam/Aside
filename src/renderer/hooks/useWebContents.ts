/**
 * useWebContents Hook
 *
 * 책임: WebContentsView 제어 (네비게이션, 뒤로가기 등)
 *
 * 사용 예:
 *   const { navigate, canGoBack, canGoForward } = useWebContents();
 *   navigate('https://google.com');
 */

import { useState, useCallback, useEffect } from 'react';
import { logger } from '../lib/logger';
import type { ViewNavigatedEvent, ViewLoadedEvent } from '@shared/types/view';

interface UseWebContentsState {
  currentUrl: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  title: string;
}

export const useWebContents = (initialUrl: string = 'https://www.google.com') => {
  const [state, setState] = useState<UseWebContentsState>({
    currentUrl: initialUrl,
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    title: 'New Tab',
  });

  // 뷰 네비게이션
  const navigate = useCallback(async (url: string) => {
    if (!window.electronAPI?.view) {
      logger.error('useWebContents - electronAPI.view not available');
      return;
    }

    try {
      logger.info('useWebContents - Navigating', { url });
      setState((prev) => ({ ...prev, isLoading: true }));

      const response = await window.electronAPI.view.navigate(url);

      if (response.success && response.url) {
        const newUrl = response.url;
        setState((prev) => ({
          ...prev,
          currentUrl: newUrl,
          isLoading: false,
        }));
        logger.info('useWebContents - Navigation successful', { url: newUrl });
      } else {
        logger.error('useWebContents - Navigation failed', { error: response.error });
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      logger.error('useWebContents - Navigation error', { error });
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Main → Renderer 이벤트 리스너
  useEffect(() => {
    if (!window.electronAPI) return;

    // 뷰 로드 완료
    const handleViewLoaded = (data: unknown) => {
      const event = data as ViewLoadedEvent;
      logger.info('useWebContents - View loaded', { url: event.url });
      setState((prev) => ({
        ...prev,
        currentUrl: event.url,
        isLoading: false,
      }));
    };

    // 뷰 네비게이션 완료
    const handleViewNavigated = (data: unknown) => {
      const event = data as ViewNavigatedEvent;
      logger.info('useWebContents - View navigated', {
        url: event.url,
        canGoBack: event.canGoBack,
        canGoForward: event.canGoForward,
      });
      setState((prev) => ({
        ...prev,
        currentUrl: event.url,
        canGoBack: event.canGoBack,
        canGoForward: event.canGoForward,
        isLoading: false,
      }));
    };

    window.electronAPI.on('view:loaded', handleViewLoaded);
    window.electronAPI.on('view:navigated', handleViewNavigated);

    return () => {
      window.electronAPI.off('view:loaded', handleViewLoaded);
      window.electronAPI.off('view:navigated', handleViewNavigated);
    };
  }, []);

  return {
    ...state,
    navigate,
  };
};
