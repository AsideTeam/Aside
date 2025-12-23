/**
 * Sidebar Component
 *
 * Zen Layout의 좌측 사이드바
 * - 탭 목록
 * - 빠른 접근 (북마크, 방문 기록)
 * - 설정 버튼
 *
 * CSS 변수 기반 스타일 사용
 * - 테마 변경 시 자동 반영
 * - 언어/레이아웃 선택 용이
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { logger } from '@renderer/lib/logger';
import { tokens, cn } from '@renderer/styles';
import { Icons } from '@renderer/lib/icons';

interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  iconName?: string;
}

export const Sidebar: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      title: 'Google',
      url: 'https://google.com',
      isActive: true,
      iconName: Icons.Search,
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
      iconName: Icons.Plus,
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
      <div className={tokens.layout.sidebar.collapsed}>
        <button
          onClick={() => setIsCollapsed(false)}
          className={cn(tokens.colors.button.ghost, 'p-2 rounded transition-colors')}
          title="Expand sidebar"
        >
          {Icons.Menu}
        </button>
        <button
          onClick={handleAddTab}
          className={cn(tokens.colors.button.ghost, 'p-2 rounded transition-colors')}
          title="New tab"
        >
          {Icons.Plus}
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
          {Icons.Close}
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
              <span className="text-sm shrink-0">{tab.iconName || '📄'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tab.title}</p>
                <p className="text-xs opacity-75 truncate">{tab.url}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(tab.id);
                }}
                className={tokens.layout.tab.closeBtn}
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
          {Icons.Plus} New Tab
        </Button>
        <Button variant="secondary" size="sm" className="w-full">
          {Icons.Bookmark} Bookmarks
        </Button>
        <Button variant="secondary" size="sm" className="w-full">
          {Icons.Settings} Settings
        </Button>
      </div>
    </div>
  );
};
