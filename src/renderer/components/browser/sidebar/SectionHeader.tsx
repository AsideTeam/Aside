/**
 * SectionHeader Component
 *
 * 사이드바 섹션 헤더 (e.g., "Space", "활성 탭")
 */

import React from 'react'
import { cn } from '@renderer/styles'
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
    <div className="flex items-center justify-between px-2 py-2">
      <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
        {title}
      </span>
      {rightContent ? (
        rightContent
      ) : onMenuClick ? (
        <button
          onClick={onMenuClick}
          className={cn(
            'p-1 rounded-md',
            'text-gray-600 hover:text-gray-400',
            'hover:bg-white/5',
            'transition-colors',
            'group'
          )}
        >
          <MoreHorizontal size={14} />
        </button>
      ) : null}
    </div>
  )
}
