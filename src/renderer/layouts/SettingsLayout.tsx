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
  children: React.ReactNode;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  children,
}) => {
  return (
    <div className="settings-container">
      <SettingsSidebar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
      />
      <main className="settings-content">
        <div className="settings-content-inner">{children}</div>
      </main>
    </div>
  );
};
