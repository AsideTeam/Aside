/**
 * Sidebar Component
 *
 * Zen Layout의 좌측 사이드바
 * - 탭 목록
 * - 빠른 접근 (북마크, 방문 기록)
 * - 설정 버튼
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { logger } from '../../lib/logger';

interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  favicon?: string;
}

export const Sidebar: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      title: 'Google',
      url: 'https://google.com',
      isActive: true,
      favicon: '🔍',
    },
  ]);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleAddTab = () => {
    logger.info('Sidebar - Add new tab');
    const newTab: Tab = {
      id: `${Date.now()}`,
      title: 'New Tab',
      url: 'https://www.google.com',
      isActive: true,
      favicon: '📄',
    };
    setTabs((prev) => [
      ...prev.map((t) => ({ ...t, isActive: false })),
      newTab,
    ]);
  };

  const handleSwitchTab = (tabId: string) => {
    logger.info('Sidebar - Switch tab', { tabId });
    setTabs((prev) =>
      prev.map((t) => ({
        ...t,
        isActive: t.id === tabId,
      }))
    );
  };

  const handleCloseTab = (tabId: string) => {
    logger.info('Sidebar - Close tab', { tabId });
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
  };

  if (isCollapsed) {
    return (
      <div className="w-16 flex flex-col items-center justify-between py-4 bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-gray-800 rounded transition-colors"
          title="Expand sidebar"
        >
          ☰
        </button>
        <button
          onClick={handleAddTab}
          className="p-2 hover:bg-gray-800 rounded transition-colors"
          title="New tab"
        >
          ➕
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900/80 to-gray-950/80 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 drag-region">
        <h1 className="text-lg font-bold text-white">Zen</h1>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-gray-800 rounded transition-colors no-drag"
          title="Collapse sidebar"
        >
          ✕
        </button>
      </div>

      {/* Tabs List */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="p-2 space-y-2">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                tab.isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
              onClick={() => handleSwitchTab(tab.id)}
            >
              <span className="text-sm flex-shrink-0">{tab.favicon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tab.title}</p>
                <p className="text-xs opacity-75 truncate">{tab.url}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/20 rounded transition-all no-drag"
                title="Close tab"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-800 p-3 space-y-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddTab}
          className="w-full"
        >
          ➕ New Tab
        </Button>
        <Button variant="secondary" size="sm" className="w-full">
          ⭐ Bookmarks
        </Button>
        <Button variant="secondary" size="sm" className="w-full">
          ⚙️ Settings
        </Button>
      </div>
    </div>
  );
};
