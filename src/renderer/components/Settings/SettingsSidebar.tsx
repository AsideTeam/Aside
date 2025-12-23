import React from 'react';

interface SettingsCategory {
  id: string;
  label: string;
  icon?: string;
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
    <aside className="w-48 bg-gray-100 border-r border-gray-200 px-0 py-4 h-full overflow-y-auto">
      <nav className="space-y-1">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`w-full text-left px-4 py-3 transition-colors duration-200 ${
              activeCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {category.icon && <span>{category.icon}</span>}
              {category.label}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
