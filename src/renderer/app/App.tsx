import React from 'react';
import { ZenLayout } from '../layouts/Layout';
import { BrowserPage } from '../pages/BrowserPage';
import { tokens, cn } from '@renderer/styles';

export const App: React.FC = () => {
  // TODO: 설정에서 layout mode를 선택할 수 있도록 구현
  // const layoutMode = useSettings().layoutMode; // 'zen' | 'browser'

  // ⭐ 디버깅: App 컴포넌트가 렌더링되는지 확인
  console.log('[App] Rendering, layoutMode: zen');

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
      {layoutMode === 'zen' ? (
        <ZenLayout />
      ) : (
        <BrowserPage />
      )}
    </div>
  );
};
