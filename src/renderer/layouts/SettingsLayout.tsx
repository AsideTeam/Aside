import React from 'react';
import { SettingsSidebar } from '../components/settings/SettingsSidebar';
import { tokens, cn } from '@renderer/styles';

interface SettingsCategory {
  id: string;
  label: string;
  iconName?: string;
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
    <div className={cn('flex h-screen', tokens.colors.bg.primary)}>
      <SettingsSidebar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
      />
      <main className={cn('flex-1 overflow-y-auto', tokens.colors.bg.secondary)}>
        <div className="max-w-3xl mx-auto px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};
