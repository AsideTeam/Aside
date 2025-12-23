import React, { useEffect } from 'react';
import { BrowserLayout } from '../layouts/BrowserLayout';
import { useBrowser } from '../hooks/useBrowser';
import { logger } from '../lib/logger';

export const BrowserPage: React.FC = () => {
  const {
    currentUrl,
    isLoading,
    canGoBack,
    canGoForward,
    navigate,
    reload,
    goBack,
    goForward,
  } = useBrowser();

  useEffect(() => {
    logger.info('BrowserPage mounted', { currentUrl });
  }, [currentUrl]);

  return (
    <BrowserLayout
      currentUrl={currentUrl}
      isLoading={isLoading}
      canGoBack={canGoBack}
      canGoForward={canGoForward}
      onNavigate={navigate}
      onReload={reload}
      onGoBack={goBack}
      onGoForward={goForward}
    >
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Aside Browser</h1>
          <p className="text-gray-600">Enter a URL to get started</p>
          <p className="text-sm text-gray-500 mt-4">Currently: {currentUrl}</p>
        </div>
      </div>
    </BrowserLayout>
  );
};
