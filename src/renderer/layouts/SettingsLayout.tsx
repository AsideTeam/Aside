import React from 'react';
import { SettingsSidebar } from '../components/settings/SettingsSidebar';

interface SettingsCategory {
  id: string;
  label: string;
  icon?: string;
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
    <div className="flex h-screen bg-white">
      <SettingsSidebar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};
