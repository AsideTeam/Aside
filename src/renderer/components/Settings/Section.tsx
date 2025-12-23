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
    <div style={{ marginBottom: '32px' }}>
      <h2
        style={{
          fontSize: 'var(--font-lg)',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '8px',
        }}
      >
        {title}
      </h2>

      {description && (
        <p
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            marginBottom: '12px',
          }}
        >
          {description}
        </p>
      )}

      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '16px',
        }}
      >
        {children}
      </div>
    </div>
  )
}
