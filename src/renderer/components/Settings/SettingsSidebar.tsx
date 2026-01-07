import React from 'react';
import { useI18n } from '@renderer/hooks/useI18n'

interface SettingsCategory {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

import { Puzzle } from 'lucide-react';

interface SettingsSidebarProps {
  categories: SettingsCategory[];
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  const { t } = useI18n()

  return (
    <aside className="settings-sidebar">
      {/* Search at Top */}
      <div className="settings-sidebar-search">
        <input
           type="text"
           placeholder={t('settings.search.placeholder')}
           className="zen-search-input"
           value={searchQuery}
           onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Navigation List */}
      <nav className="settings-sidebar-nav">
        {categories.filter(c => c.id !== 'extensions').map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`settings-sidebar-item ${isActive ? 'active' : ''}`}
            >
              {category.icon}
              <span>{category.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions (Extensions) */}
      <div className="mt-auto pt-4 border-t border-[#2B2A33]">
         <button
            className={`settings-sidebar-item ${activeCategory === 'extensions' ? 'active' : ''}`}
            onClick={() => onSelectCategory('extensions')}
         >
            <Puzzle className="w-5 h-5" />
            <span>{t('category.extensions')}</span>
         </button>
      </div>
    </aside>
  );
};
