/**
 * SettingRow - 설정 항목 한 줄 렌더링
 *
 * 책임: 라벨, 설명, 컨트롤을 한 줄에 배치
 * 특징: 순수 렌더링 컴포넌트 (상태 없음, 콜백만 전달)
 */

import React, { useState } from 'react'

interface SettingRowProps {
  label: string | React.ReactNode
  description?: string
  children?: React.ReactNode
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '18px 12px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: isHovered ? 'var(--bg-hover, rgba(0,0,0,0.02))' : 'transparent',
        transition: 'background-color 0.2s ease',
        borderRadius: '4px',
        gap: '24px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--font-md)',
            fontWeight: '500',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            wordBreak: 'break-word',
            lineHeight: '1.4',
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: 'var(--font-sm)',
              color: 'var(--text-secondary)',
              marginTop: '6px',
              lineHeight: '1.5',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {description}
          </div>
        )}
      </div>
      {children && (
        <div 
          style={{ 
            marginLeft: 'auto', 
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

