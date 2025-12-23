/**
 * SettingsSidebar - 설정 사이드바
 * 
 * CSS 클래스 기반의 깔끔한 네이티브 스타일
 */

import type { SettingsMenuItem } from '../../constants/settingsMenu'

interface SettingsSidebarProps {
  items: SettingsMenuItem[]
  activeMenuId: string
  onMenuChange?: (menuId: string) => void
}

export function SettingsSidebar({
  items,
  activeMenuId,
  onMenuChange,
}: SettingsSidebarProps) {
  return (
    <aside className="settings-sidebar">
      <div className="settings-sidebar-title">설정</div>
      
      <nav className="settings-sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeMenuId === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onMenuChange?.(item.id)}
              className={`settings-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="settings-sidebar-item-icon" size={18} />
              <span className="settings-sidebar-item-label">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

