/**
 * Section - 설정 섹션 컨테이너
 */

import React from 'react'

interface SectionProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">{title}</h2>
        {description && (
          <p className="settings-section-description">{description}</p>
        )}
      </div>
      <div className="settings-section-content">{children}</div>
    </section>
  )
}

