/**
 * TabListItem Component
 *
 * 활성 탭 리스트 아이템 (현재 열려있는 탭)
 */

import React from 'react'
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
      className={isActive ? 'sidebar-tab-item sidebar-tab-item--active' : 'sidebar-tab-item'}
      title={title}
    >
      <div className="sidebar-tab-item-left">
        <div className="sidebar-tab-icon">
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
            <Globe size={12} />
          )}
        </div>

        <span className="sidebar-tab-title">
          {title || 'Untitled'}
        </span>
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose(id)
        }}
        className="sidebar-tab-close"
        aria-label="Close tab"
      >
        <X size={14} />
      </button>
    </div>
  )
}
