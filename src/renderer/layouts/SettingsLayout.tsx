import React from 'react';
import { SettingsSidebar } from '../components/Settings/SettingsSidebar';
import { tokens, cn } from '@renderer/styles';

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
    <div className={cn(tokens.layout.settings.container)}>
      <SettingsSidebar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
      />
      <main className={cn('settings-content')}>
        <div className="settings-content-inner">{children}</div>
      </main>
    </div>
  );
};
