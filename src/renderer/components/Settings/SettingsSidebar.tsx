/**
 * SettingsSidebar - 왼쪽 네비게이션 사이드바
 *
 * 책임: 설정 메뉴 항목 렌더링 + 선택 처리
 * 특징: 메뉴만 관리, 내용은 부모(SettingsPage)에서 처리
 */

import React from 'react'
import { SETTINGS_MENU_ITEMS } from '@shared/constants/settings'

interface SettingsSidebarProps {
  activeMenuId: string
  onMenuChange?: (menuId: string) => void
}

export function SettingsSidebar({
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
        <div
          style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--color-primary)',
          }}
        >
          ⚙️
        </div>
        <span
          style={{
            fontSize: 'var(--font-lg)',
            fontWeight: '600',
            color: 'var(--text-primary)',
          }}
        >
          Settings
        </span>
      </div>

      {/* 메뉴 항목 */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {SETTINGS_MENU_ITEMS.map((item) => (
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
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              borderLeft:
                activeMenuId === item.id
                  ? '4px solid var(--color-primary)'
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
                    ? 'var(--color-primary)'
                    : 'var(--text-secondary)',
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 'var(--font-sm)',
                  fontWeight: '500',
                  color:
                    activeMenuId === item.id
                      ? 'var(--color-primary)'
                      : 'var(--text-primary)',
                }}
              >
                {item.label}
              </div>
              {item.description && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    marginTop: '2px',
                  }}
                >
                  {item.description}
                </div>
              )}
            </div>
          </button>
        ))}
      </nav>
    </aside>
  )
}
