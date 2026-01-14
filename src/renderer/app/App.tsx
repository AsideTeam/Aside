import React from 'react';
import { ZenLayout } from '../layouts/Layout';
import { ChromeLayout } from '../layouts/ChromeLayout';
import { tokens, cn } from '@renderer/styles';
import { AppSettingsProvider, useApplyAppSettingsEffects } from '@renderer/hooks';
import { useAppSettings } from '@renderer/hooks/settings/useAppSettings';

const AppInner: React.FC = () => {
  useApplyAppSettingsEffects();

  const { settings } = useAppSettings();
  const layoutMode = settings?.layoutMode ?? 'zen';

  return (
    <div
      className={cn(
        'w-full h-screen overflow-hidden pointer-events-none', // CRITICAL: Allow click-through to WebContentsView
        tokens.colors.text.primary
      )}
    >
      {layoutMode === 'zen' ? <ZenLayout /> : <ChromeLayout />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppSettingsProvider>
      <AppInner />
    </AppSettingsProvider>
  );
};
