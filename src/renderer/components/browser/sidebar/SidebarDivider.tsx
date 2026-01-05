/**
 * SidebarDivider Component
 *
 * 섹션 구분선 (텍스트 포함)
 */

import React from 'react'
import { cn } from '@renderer/styles'

interface SidebarDividerProps {
  text?: string
  className?: string
}

export const SidebarDivider: React.FC<SidebarDividerProps> = ({
  text,
  className,
}) => {
  if (text) {
    return (
      <div className={cn('flex items-center gap-3 px-2 py-4', className)}>
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-[11px] text-gray-600 font-medium uppercase tracking-wide">
          {text}
        </span>
        <div className="flex-1 h-px bg-white/5" />
      </div>
    )
  }

  return <div className={cn('h-px bg-white/5 my-2 mx-2', className)} />
}
