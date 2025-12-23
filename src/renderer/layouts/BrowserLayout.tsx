import React from 'react';
import { AddressBar } from '../components/browser/AddressBar';

interface BrowserLayoutProps {
  currentUrl: string;
  isLoading?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onNavigate: (url: string) => void;
  onReload: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  children: React.ReactNode;
}

export const BrowserLayout: React.FC<BrowserLayoutProps> = ({
  currentUrl,
  isLoading = false,
  canGoBack = false,
  canGoForward = false,
  onNavigate,
  onReload,
  onGoBack,
  onGoForward,
  children,
}) => {
  return (
    <div className="flex flex-col h-screen bg-white">
      <AddressBar
        currentUrl={currentUrl}
        onNavigate={onNavigate}
        onReload={onReload}
        onGoBack={onGoBack}
        onGoForward={onGoForward}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        isLoading={isLoading}
      />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
};
