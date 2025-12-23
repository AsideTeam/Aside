import React, { useEffect } from 'react';
import { BrowserLayout } from '../layouts/BrowserLayout';
import { useBrowser } from '../hooks/useBrowser';
import { logger } from '../lib/logger';
import { tokens, cn } from '@renderer/styles';

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
      <div className={cn('w-full h-full flex items-center justify-center', tokens.colors.bg.primary)}>
        <div className="text-center">
          <h1 className={cn('text-3xl font-bold mb-2', tokens.colors.text.primary)}>Aside Browser</h1>
          <p className={tokens.colors.text.secondary}>Enter a URL to get started</p>
          <p className={cn('text-sm mt-4', tokens.colors.text.muted)}>Currently: {currentUrl}</p>
        </div>
      </div>
    </BrowserLayout>
  );
};
