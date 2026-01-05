/**
 * SidebarDivider Component
 *
 * 섹션 구분선 (텍스트 포함)
 */

import React from 'react'

interface SidebarDividerProps {
  text?: string
  className?: string
}

export const SidebarDivider: React.FC<SidebarDividerProps> = ({
  text,
}) => {
  if (text) {
    return (
      <div className="sidebar-divider">
        <div className="sidebar-divider-line" />
        <span className="sidebar-divider-text">
          {text}
        </span>
        <div className="sidebar-divider-line" />
      </div>
    )
  }

  return <div className="sidebar-divider-line" />
}
