import React from 'react';
import { ZenLayout } from '../layouts/Layout';
import { BrowserPage } from '../pages/BrowserPage';
import { tokens, cn } from '@renderer/styles';
import { useApplyAppSettingsEffects } from '@renderer/hooks';
import { AppSettingsProvider } from '@renderer/hooks/useAppSettings';

const AppInner: React.FC = () => {
  useApplyAppSettingsEffects();

  // TODO: 설정에서 layout mode를 선택할 수 있도록 구현
  // const layoutMode = useSettings().layoutMode; // 'zen' | 'browser'

  // 현재는 Zen Layout 기본값 사용
  const layoutMode = 'zen';

  return (
    <div
      className={cn(
        'w-full h-screen overflow-hidden',
        layoutMode === 'zen' ? '' : tokens.colors.bg.primary,
        tokens.colors.text.primary
      )}
    >
      {layoutMode === 'zen' ? <ZenLayout /> : <BrowserPage />}
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
