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
      <div className="sidebar-tab-item-content">
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {favicon ? (
            <img
              src={favicon}
              alt=""
              className="w-3 h-3 rounded-sm object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <Globe size={12} className="text-(--color-text-secondary)" />
          )}
        </div>

        <span className="sidebar-tab-title">
          {title || 'Untitled'}
        </span>
      </div>

      {/* Close Button - reusing sidebar-space-close style or similar */}
      {/* We didn't explicitly define sidebar-tab-close in sidebar.css but shared styles often work.
          Let's use a generic close button style inline or reuse utility classes if available.
          For now, I'll use a specific class that matches the PinnedTabItem style for consistency.
      */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose(id)
        }}
        className="sidebar-space-close" 
        aria-label="Close tab"
      >
        <X size={12} />
      </button>
    </div>
  )
}
