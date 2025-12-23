/**
 * SettingRow - 설정 항목 한 줄 렌더링
 *
 * 책임: 라벨, 설명, 컨트롤을 한 줄에 배치
 * 특징: 순수 렌더링 컴포넌트 (상태 없음, 콜백만 전달)
 */

import React from 'react'

interface SettingRowProps {
  label: string
  description?: string
  children?: React.ReactNode
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 'var(--font-md)',
            fontWeight: '500',
            color: 'var(--text-primary)',
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: 'var(--font-sm)',
              color: 'var(--text-secondary)',
              marginTop: '4px',
            }}
          >
            {description}
          </div>
        )}
      </div>
      {children && (
        <div style={{ marginLeft: '16px', flexShrink: 0 }}>{children}</div>
      )}
    </div>
  )
}
