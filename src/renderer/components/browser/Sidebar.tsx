/**
 * Sidebar Component - Aside Browser
 *
 * 미니멀한 사이드바
 * - 상단: 고정 탭 그리드
 * - 중간: 탭 목록
 * - 하단: 액션 버튼
 */

import React, { useEffect, useState } from 'react';
import {
  Plus,
  X,
  Download,
  FolderClosed,
  Globe,
  Settings,
} from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isActive: boolean;
  isPinned?: boolean;
}

interface PinnedTab {
  id: string;
  title: string;
  url: string;
}

// 더미 데이터
const PINNED_TABS: PinnedTab[] = [
  { id: 'p1', title: 'GitHub', url: 'https://github.com' },
  { id: 'p2', title: 'ChatGPT', url: 'https://chat.openai.com' },
];

const INITIAL_TABS: Tab[] = [
  {
    id: '1',
    title: 'Google',
    url: 'https://google.com',
    isActive: true,
    isPinned: false,
  },
];

export const Sidebar: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>(INITIAL_TABS);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    try {
      window.electronAPI?.on('sidebar:open', open);
      window.electronAPI?.on('sidebar:close', close);
    } catch {
      // ignore
    }

    return () => {
      try {
        window.electronAPI?.off('sidebar:open', open);
        window.electronAPI?.off('sidebar:close', close);
      } catch {
        // ignore
      }
    };
  }, []);

  const handleAddTab = () => {
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      title: 'New Tab',
      url: 'about:blank',
      isActive: true,
      isPinned: false,
    };
    setTabs((prev) => [
      ...prev.map((t) => ({ ...t, isActive: false })),
      newTab,
    ]);
  };

  const handleSelectTab = (tabId: string) => {
    setTabs((prev) =>
      prev.map((t) => ({ ...t, isActive: t.id === tabId }))
    );
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
  };

  return (
    <aside className={isOpen ? 'aside-sidebar aside-sidebar--open' : 'aside-sidebar'}>

      {/* Pinned Tabs */}
      <div className="aside-pinned-area">
        <div className="aside-pinned-grid">
          {PINNED_TABS.map((tab) => (
            <button
              key={tab.id}
              className="aside-pinned-tab"
              title={tab.title}
            >
              <Globe size={20} />
            </button>
          ))}
        </div>
      </div>

      {/* Space Label */}
      <div className="aside-space-header">
        <span className="aside-space-label">Aside</span>
      </div>

      {/* Tabs List */}
      <div className="aside-tabs-area">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`aside-tab ${tab.isActive ? 'aside-tab-active' : ''}`}
            onClick={() => handleSelectTab(tab.id)}
          >
            <div className="aside-tab-icon">
              <Globe size={16} />
            </div>
            <span className="aside-tab-title">{tab.title}</span>
            <button
              className="aside-tab-close"
              onClick={(e) => handleCloseTab(tab.id, e)}
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* Folder */}
        <div className="aside-folder">
          <div className="aside-folder-icon">
            <FolderClosed size={16} />
          </div>
          <span className="aside-folder-title">New Folder</span>
        </div>
      </div>

      {/* Divider */}
      <div className="aside-divider">
        <span className="aside-divider-text">탭 정리</span>
      </div>

      {/* New Tab Button */}
      <button className="aside-new-tab" onClick={handleAddTab}>
        <Plus size={16} />
        <span className="aside-label">새 탭</span>
      </button>

      {/* Bottom Actions */}
      <div className="aside-bottom-actions">
        <button className="aside-action-btn" title="Downloads">
          <Download size={18} />
        </button>
        <div className="flex-1" />
        <button className="aside-action-btn" title="Settings">
          <Settings size={18} />
        </button>
      </div>
    </aside>
  );
};
