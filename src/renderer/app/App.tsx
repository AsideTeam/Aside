import React from 'react';
import { BrowserPage } from '../pages/BrowserPage';

export const App: React.FC = () => {

  // 메인 브라우저 페이지 렌더링
  const renderPage = () => {
    return <BrowserPage />;
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      {renderPage()}
      
      {/* Global Navigation (optional) */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
      `}</style>
    </div>
  );
};
