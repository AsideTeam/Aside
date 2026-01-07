import React from 'react';
import { SettingsSidebar } from '../components/Settings/SettingsSidebar';


interface SettingsCategory {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SettingsLayoutProps {
  categories: SettingsCategory[];
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  children: React.ReactNode;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  children,
}) => {
  return (
    <div className="settings-layout">
      <SettingsSidebar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
      <main className="settings-content-shell">
        <div className="settings-container">{children}</div>
      </main>
    </div>
  );
};
