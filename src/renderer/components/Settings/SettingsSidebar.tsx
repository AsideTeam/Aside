import React from 'react';
import { cn } from '@renderer/styles/tokens';
import { tokens } from '@renderer/styles';
import { Settings } from 'lucide-react';

interface SettingsCategory {
  id: string;
  label: string;
  icon?: React.ReactNode;
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
      <div className={cn('px-4 pt-2 pb-3', tokens.colors.text.primary)}>
        <div className="flex items-center gap-2 text-base font-semibold">
          <Settings className="w-4 h-4" />
          <span>설정</span>
        </div>
      </div>
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
              {category.icon ? <span className="w-4 h-4 shrink-0">{category.icon}</span> : null}
              {category.label}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
