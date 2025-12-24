import React from 'react';
import { AddressBar } from '../components/browser/AddressBar';
import { tokens, cn } from '@renderer/styles';

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
  onNavigate,
  children,
}) => {
  return (
    <div className={cn('flex flex-col h-screen', tokens.colors.bg.secondary)}>
      <AddressBar
        currentUrl={currentUrl}
        onNavigate={onNavigate}
      />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
};
