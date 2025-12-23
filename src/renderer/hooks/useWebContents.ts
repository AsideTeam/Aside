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
import { IPC_CHANNELS } from '@shared/ipc/channels'
import { ViewLoadedEventSchema, ViewNavigatedEventSchema } from '@shared/validation/schemas'

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

  const goBack = useCallback(async () => {
    if (!window.electronAPI?.tab) {
      logger.error('useWebContents - electronAPI.tab not available');
      return;
    }

    try {
      await window.electronAPI.tab.back();
    } catch (error) {
      logger.error('useWebContents - Go back error', { error });
    }
  }, []);

  const goForward = useCallback(async () => {
    if (!window.electronAPI?.tab) {
      logger.error('useWebContents - electronAPI.tab not available');
      return;
    }

    try {
      await window.electronAPI.tab.forward();
    } catch (error) {
      logger.error('useWebContents - Go forward error', { error });
    }
  }, []);

  const reload = useCallback(async () => {
    if (!window.electronAPI?.tab) {
      logger.error('useWebContents - electronAPI.tab not available');
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await window.electronAPI.tab.reload();
    } catch (error) {
      logger.error('useWebContents - Reload error', { error });
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Main → Renderer 이벤트 리스너
  useEffect(() => {
    if (!window.electronAPI) return;

    // 뷰 로드 완료
    const handleViewLoaded = (data: unknown) => {
      const parsed = ViewLoadedEventSchema.safeParse(data)
      if (!parsed.success) return
      const event = parsed.data
      logger.info('useWebContents - View loaded', { url: event.url });
      setState((prev) => ({
        ...prev,
        currentUrl: event.url,
        isLoading: false,
      }));
    };

    // 뷰 네비게이션 완료
    const handleViewNavigated = (data: unknown) => {
      const parsed = ViewNavigatedEventSchema.safeParse(data)
      if (!parsed.success) return
      const event = parsed.data
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

    window.electronAPI.on(IPC_CHANNELS.VIEW.LOADED, handleViewLoaded);
    window.electronAPI.on(IPC_CHANNELS.VIEW.NAVIGATED, handleViewNavigated);

    return () => {
      window.electronAPI.off(IPC_CHANNELS.VIEW.LOADED, handleViewLoaded);
      window.electronAPI.off(IPC_CHANNELS.VIEW.NAVIGATED, handleViewNavigated);
    };
  }, []);

  return {
    ...state,
    navigate,
    goBack,
    goForward,
    reload,
  };
};
