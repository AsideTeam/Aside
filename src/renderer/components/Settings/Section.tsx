/**
 * Section - 설정 섹션 컨테이너
 *
 * 책임: 제목, 설명, 내용을 박스 형태로 배치
 * 특징: 레이아웃만 담당, 내용은 children으로 받음
 */

import React from 'react'

interface SectionProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <div style={{ marginBottom: '56px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '8px',
            letterSpacing: '-0.3px',
            lineHeight: '1.4',
          }}
        >
          {title}
        </h2>

        {description && (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              margin: '0',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {description}
          </p>
        )}
      </div>

      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          padding: '0',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
        }}
      >
        <div style={{ padding: '0' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

