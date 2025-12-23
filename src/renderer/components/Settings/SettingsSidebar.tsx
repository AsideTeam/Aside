/**
 * SettingsSidebar - 왼쪽 네비게이션 사이드바
 *
 * 책임: 설정 메뉴 항목 렌더링 + 선택 처리
 * 특징: 메뉴만 관리, 내용은 부모(SettingsPage)에서 처리
 */

import type { SettingsMenuItem } from '@shared/constants/settings'

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
    <aside
      style={{
        width: '256px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        padding: '16px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}
    >
      {/* 로고 영역 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          paddingLeft: '8px',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-lg)',
            fontWeight: '700',
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
          }}
        >
          설정
        </span>
      </div>

      {/* 메뉴 항목 */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onMenuChange?.(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 12px',
              background:
                activeMenuId === item.id
                  ? 'rgba(var(--accent-rgb, 37, 99, 235), 0.1)'
                  : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              borderLeft:
                activeMenuId === item.id
                  ? '4px solid var(--accent)'
                  : '4px solid transparent',
              paddingLeft: 'calc(12px - 4px)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (activeMenuId !== item.id) {
                e.currentTarget.style.background = 'var(--bg-input)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeMenuId !== item.id) {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            <item.icon
              size={18}
              style={{
                color:
                  activeMenuId === item.id
                    ? 'var(--accent)'
                    : 'var(--text-secondary)',
              }}
            />
            <div
              style={{
                fontSize: 'var(--font-sm)',
                fontWeight: '500',
                color:
                  activeMenuId === item.id
                    ? 'var(--accent)'
                    : 'var(--text-primary)',
              }}
            >
              {item.label}
            </div>
          </button>
        ))}
      </nav>
    </aside>
  )
}

