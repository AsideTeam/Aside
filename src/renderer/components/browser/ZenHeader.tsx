import React, { useEffect, useState } from 'react';
import { AddressBar } from './AddressBar';
import { useWebContents } from '@renderer/hooks/useWebContents';

export const ZenHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUrl, isLoading, canGoBack, canGoForward, navigate, reload, goBack, goForward } =
    useWebContents();

  useEffect(() => {
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    try {
      window.electronAPI?.on('header:open', open);
      window.electronAPI?.on('header:close', close);
    } catch {
      // ignore
    }

    return () => {
      try {
        window.electronAPI?.off('header:open', open);
        window.electronAPI?.off('header:close', close);
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <div className={isOpen ? 'aside-header aside-header--open' : 'aside-header'}>
      <AddressBar
        currentUrl={currentUrl}
        onNavigate={navigate}
        onReload={reload}
        onGoBack={goBack}
        onGoForward={goForward}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        isLoading={isLoading}
        wrapperClassName="aside-header-surface"
        inputClassName="aside-header-input"
      />
    </div>
  );
};
