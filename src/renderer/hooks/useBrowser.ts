import { useState, useCallback } from 'react';
import { logger } from '../lib/logger';

interface BrowserHistory {
  back: string[];
  forward: string[];
}

export const useBrowser = (initialUrl: string = 'https://www.google.com') => {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<BrowserHistory>({
    back: [],
    forward: [],
  });

  const navigate = useCallback(
    (url: string) => {
      logger.info('useBrowser - Navigate', { url, previousUrl: currentUrl });
      setIsLoading(true);

      // Add current URL to back history if it exists
      if (currentUrl !== url) {
        setHistory((prev) => ({
          ...prev,
          back: [...prev.back, currentUrl],
          forward: [],
        }));
      }

      setCurrentUrl(url);

      // Simulate loading time
      setTimeout(() => {
        setIsLoading(false);
        logger.info('useBrowser - Navigation complete', { url });
      }, 1000);
    },
    [currentUrl]
  );

  const goBack = useCallback(() => {
    logger.info('useBrowser - Go back', { currentUrl, historyLength: history.back.length });
    setHistory((prev) => {
      if (prev.back.length === 0) {
        logger.warn('useBrowser - No history to go back');
        return prev;
      }

      const newBack = [...prev.back];
      const previousUrl = newBack.pop();

      if (previousUrl) {
        setCurrentUrl(previousUrl);
        logger.info('useBrowser - Went back', { previousUrl });
      }

      return {
        back: newBack,
        forward: [currentUrl, ...prev.forward],
      };
    });
  }, [currentUrl, history.back.length]);

  const goForward = useCallback(() => {
    logger.info('useBrowser - Go forward', { currentUrl, forwardHistoryLength: history.forward.length });
    setHistory((prev) => {
      if (prev.forward.length === 0) {
        logger.warn('useBrowser - No forward history');
        return prev;
      }

      const newForward = [...prev.forward];
      const nextUrl = newForward.shift();

      if (nextUrl) {
        setCurrentUrl(nextUrl);
        logger.info('useBrowser - Went forward', { nextUrl });
      }

      return {
        back: [...prev.back, currentUrl],
        forward: newForward,
      };
    });
  }, [currentUrl, history.forward.length]);

  const reload = useCallback(() => {
    logger.info('useBrowser - Reload', { currentUrl });
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      logger.info('useBrowser - Reload complete');
    }, 1000);
  }, [currentUrl]);

  return {
    currentUrl,
    isLoading,
    canGoBack: history.back.length > 0,
    canGoForward: history.forward.length > 0,
    navigate,
    goBack,
    goForward,
    reload,
  };
};
