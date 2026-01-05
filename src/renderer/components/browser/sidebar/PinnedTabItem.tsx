/**
 * PinnedTabItem Component
 *
 * 고정된 탭/북마크 아이템 (Favicon + Title)
 */

import React from 'react'
import { cn } from '@renderer/styles'
import { Globe, Folder } from 'lucide-react'

interface PinnedTabItemProps {
  id: string
  title: string
  icon?: React.ReactNode
  type?: 'tab' | 'bookmark' | 'folder'
  isActive?: boolean
  onSelect?: (id: string) => void
  onDelete?: (id: string) => void
}

export const PinnedTabItem: React.FC<PinnedTabItemProps> = ({
  id,
  title,
  icon,
  type = 'bookmark',
  isActive = false,
  onSelect,
  onDelete,
}) => {
  return (
    <div
      onClick={() => onSelect?.(id)}
      className={cn(
        'group flex items-center justify-between',
        'w-full px-3 py-2.5 rounded-lg',
        'cursor-pointer transition-all duration-200',
        isActive
          ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/5'
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5',
        'truncate'
      )}
      title={title}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        {/* Icon */}
        <div className={cn(
          'w-5 h-5 flex items-center justify-center shrink-0',
          'rounded-md',
          isActive ? 'bg-blue-500/20 text-blue-400' : 'text-gray-600'
        )}>
          {icon || (type === 'folder' ? <Folder size={14} /> : <Globe size={14} />)}
        </div>

        {/* Title */}
        <span className={cn(
          'text-[13px] font-medium',
          'truncate',
          'leading-none pb-0.5'
        )}>
          {title}
        </span>
      </div>

      {/* Delete Button (hover) */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(id)
          }}
          className={cn(
            'p-1 rounded-md',
            'opacity-0 group-hover:opacity-100',
            'text-gray-500 hover:text-red-400 hover:bg-red-500/10',
            'transition-all duration-200',
            'shrink-0',
            'ml-2'
          )}
          aria-label="Delete"
        >
          <span className="text-sm">×</span>
        </button>
      )}
    </div>
  )
}
