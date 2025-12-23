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
import { logger } from '@renderer/lib/logger';
import { tokens, cn } from '@renderer/styles';

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
          className={cn(tokens.colors.button.ghost, 'p-2 rounded transition-colors')}
          title="Expand sidebar"
        >
          ☰
        </button>
        <button
          onClick={handleAddTab}
          className={cn(tokens.colors.button.ghost, 'p-2 rounded transition-colors')}
          title="New tab"
        >
          ➕
        </button>
      </div>
    );
  }

  return (
    <div className={tokens.layout.sidebar.wrapper}>
      {/* Header */}
      <div className={tokens.layout.sidebar.header}>
        <h1 className={tokens.layout.sidebar.title}>Zen</h1>
        <button
          onClick={() => setIsCollapsed(true)}
          className={cn(tokens.colors.button.ghost, 'p-1 rounded transition-colors no-drag')}
          title="Collapse sidebar"
        >
          ✕
        </button>
      </div>

      {/* Tabs List */}
      <div className={tokens.layout.sidebar.content}>
        <div className="p-2 space-y-2">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                tokens.layout.tab.wrapper,
                tab.isActive ? tokens.layout.tab.active : tokens.layout.tab.inactive
              )}
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
      <div className={tokens.layout.sidebar.actions}>
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
