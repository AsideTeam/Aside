/**
 * SectionHeader Component
 *
 * 사이드바 섹션 헤더 (e.g., "Space")
 */

import React from 'react'
import { MoreHorizontal } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  onMenuClick?: () => void
  rightContent?: React.ReactNode
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  onMenuClick,
  rightContent,
}) => {
  return (
    <div className="sidebar-section-header">
      <span className="sidebar-section-title">
        {title}
      </span>
      {rightContent ? (
        rightContent
      ) : onMenuClick ? (
        <button
          onClick={onMenuClick}
          className="sidebar-section-menu"
        >
          <MoreHorizontal size={14} />
        </button>
      ) : null}
    </div>
  )
}
