import React from 'react';
import { cn } from '@renderer/styles/tokens';
import { tokens } from '@renderer/styles';

interface SettingsCategory {
  id: string;
  label: string;
  iconName?: string;
}

interface SettingsSidebarProps {
  categories: SettingsCategory[];
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <aside className={tokens.layout.settings.sidebar}>
      <nav className="space-y-1">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              'w-full text-left px-4 py-3 transition-colors duration-200',
              activeCategory === category.id
                ? 'bg-(--color-accent) text-white'
                : cn(tokens.colors.text.secondary, 'hover:bg-(--color-bg-hover)')
            )}
          >
            <span className="flex items-center gap-2">
              {category.iconName && <span>{category.iconName}</span>}
              {category.label}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
