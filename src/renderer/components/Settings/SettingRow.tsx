/**
 * SettingRow - 설정 항목 행
 */

import React from 'react'

interface SettingRowProps {
  label: string | React.ReactNode
  description?: string
  children?: React.ReactNode
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="setting-row">
      <div className="setting-row-info">
        <div className="setting-row-label">{label}</div>
        {description && (
          <div className="setting-row-description">{description}</div>
        )}
      </div>
      {children && (
        <div className="setting-row-control">{children}</div>
      )}
    </div>
  )
}

