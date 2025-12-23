/**
 * Sidebar Component (Zen Browser Style)
 *
 * Zen Browser 스타일 사이드바
 * - 깔끔하고 미니멀한 디자인
 * - 탭 관리
 * - 빠른 접근 (북마크, 히스토리)
 * - 설정
 */

import React, { useState } from 'react';
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
      iconName: Icons.Home,
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
        <div className="flex-1" />
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
      <div className={cn(tokens.layout.sidebar.header, 'drag-region')}>
        <h1 className={tokens.layout.sidebar.title}>Aside</h1>
        <button
          onClick={() => setIsCollapsed(true)}
          className={cn(tokens.colors.button.ghost, 'p-1 rounded transition-colors no-drag')}
          title="Collapse sidebar"
        >
          {Icons.Close}
        </button>
      </div>

      {/* Main Content */}
      <div className={cn('flex-1 overflow-y-auto', 'flex flex-col')}>
        {/* Tabs Section */}
        <div className="px-3 py-4">
          <div className="space-y-2">
            {tabs.length > 0 ? (
              tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={cn(
                    'tab-wrapper',
                    tab.isActive ? tokens.layout.tab.active : tokens.layout.tab.inactive
                  )}
                  onClick={() => handleSwitchTab(tab.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{tab.title}</p>
                    <p className="text-xs opacity-70 truncate">{tab.url}</p>
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
              ))
            ) : (
              <div className={cn('text-center py-6', tokens.colors.text.secondary)}>
                <p className="text-xs">No tabs open</p>
              </div>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-(--color-border-primary)" />

        {/* Quick Access Section */}
        <div className="px-3 py-4">
          <p className={cn('text-xs font-semibold mb-3 uppercase tracking-wide', tokens.colors.text.secondary)}>
            Quick Access
          </p>
          <div className="space-y-2">
            <button
              onClick={handleAddTab}
              className={cn(
                'w-full text-left px-3 py-2 rounded transition-colors',
                tokens.colors.button.secondary,
                'hover:bg-(--color-bg-hover) text-sm'
              )}
            >
              {Icons.Plus} New Tab
            </button>
            <button
              className={cn(
                'w-full text-left px-3 py-2 rounded transition-colors',
                tokens.colors.button.secondary,
                'hover:bg-(--color-bg-hover) text-sm'
              )}
            >
              {Icons.Bookmark} Bookmarks
            </button>
            <button
              className={cn(
                'w-full text-left px-3 py-2 rounded transition-colors',
                tokens.colors.button.secondary,
                'hover:bg-(--color-bg-hover) text-sm'
              )}
            >
              {Icons.History} History
            </button>
          </div>
        </div>
      </div>

      {/* Footer - Settings */}
      <div className={cn('border-t border-(--color-border-primary)', 'p-3')}>
        <button
          className={cn(
            'w-full text-left px-3 py-2 rounded transition-colors',
            tokens.colors.button.secondary,
            'hover:bg-(--color-bg-hover) text-sm'
          )}
        >
          {Icons.Settings} Settings
        </button>
      </div>
    </div>
  );
};
