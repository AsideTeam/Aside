/**
 * TabListItem Component
 *
 * 활성 탭 리스트 아이템 (현재 열려있는 탭)
 */

import React from 'react'
import { cn } from '@renderer/styles'
import { Globe, X } from 'lucide-react'

interface TabListItemProps {
  id: string
  title: string
  favicon?: string
  isActive: boolean
  onSelect: (id: string) => void
  onClose: (id: string) => void
}

export const TabListItem: React.FC<TabListItemProps> = ({
  id,
  title,
  favicon,
  isActive,
  onSelect,
  onClose,
}) => {
  return (
    <div
      onClick={() => onSelect(id)}
      className={cn(
        'group flex items-center justify-between',
        'px-3 py-2.5 rounded-lg',
        'cursor-pointer transition-all duration-200',
        'truncate',
        isActive
          ? 'bg-white text-black shadow-md ring-1 ring-white/20'
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
      )}
      title={title}
    >
      {/* Left: Icon + Title */}
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div
          className={cn(
            'w-5 h-5 flex items-center justify-center shrink-0 rounded-md',
            isActive ? 'bg-blue-500/30 text-blue-500' : 'text-gray-600'
          )}
        >
          {favicon ? (
            <img
              src={favicon}
              alt=""
              className="w-4 h-4 rounded-sm object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <Globe size={14} />
          )}
        </div>

        <span className={cn(
          'text-[13px] font-medium',
          'truncate',
          'leading-none pb-0.5'
        )}>
          {title || 'Untitled'}
        </span>
      </div>

      {/* Right: Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose(id)
        }}
        className={cn(
          'p-1 rounded-md',
          'opacity-0 group-hover:opacity-100',
          isActive && 'opacity-100',
          'text-gray-600 hover:text-gray-800 hover:bg-black/10',
          'transition-all duration-200',
          'shrink-0',
          'ml-2'
        )}
        aria-label="Close tab"
      >
        <X size={14} />
      </button>
    </div>
  )
}
