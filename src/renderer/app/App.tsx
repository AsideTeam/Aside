import React from 'react';
import { ZenLayout } from '../layouts/Layout';
import { BrowserPage } from '../pages/BrowserPage';

export const App: React.FC = () => {
  // TODO: 설정에서 layout mode를 선택할 수 있도록 구현
  // const layoutMode = useSettings().layoutMode; // 'zen' | 'browser'

  // 현재는 Zen Layout 기본값 사용
  const layoutMode = 'zen';

  return (
    <div className="w-full h-screen overflow-hidden">
      {layoutMode === 'zen' ? (
        <ZenLayout />
      ) : (
        <BrowserPage />
      )}

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        
        /* Drag region 스타일 (창 이동 가능 영역) */
        .drag-region {
          -webkit-app-region: drag;
        }
        
        /* 버튼 등은 클릭 가능해야 하므로 no-drag */
        .no-drag {
          -webkit-app-region: no-drag;
        }
      `}</style>
    </div>
  );
};
