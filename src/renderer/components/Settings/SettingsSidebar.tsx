import React from 'react';

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
    <aside className="settings-sidebar">
      <div className="px-6 py-8 mb-2">
        <div className="flex items-center gap-4 text-xl font-medium text-[#E3E3E3] tracking-tight">
          <div className="w-8 h-8 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: 'url(/assets/icon.png)' }} />
          <span>설정</span>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto px-0 py-2">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`settings-sidebar-item w-full group ${isActive ? 'active' : ''}`}
            >
              <div className={`transition-colors duration-200 ${isActive ? "text-[#062E6F]" : "text-[#C4C7C5] group-hover:text-[#E3E3E3]"}`}>
                {category.icon}
              </div>
              <span className="flex-1 text-left">{category.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="text-xs text-[#C4C7C5] text-center border-t border-[#444746] pt-4">
          Aside Browser v0.1.0
        </div>
      </div>
    </aside>
  );
};
