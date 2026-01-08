/**
 * PinnedTabItem Component
 *
 * 고정된 탭/북마크 아이템 (Favicon + Title)
 */

import React from 'react'
import { Globe, Folder, X } from 'lucide-react'

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
      className={isActive ? 'sidebar-space-item sidebar-space-item--active' : 'sidebar-space-item'}
      title={title}
    >
      <div className="sidebar-space-favicon">
        {icon || (type === 'folder' ? <Folder size={10} /> : <Globe size={10} />)}
      </div>

      <span className="sidebar-space-text">
        {title}
      </span>

      {/* Close/Delete Button (hover) */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(id)
          }}
          className="sidebar-space-close"
          aria-label="Delete"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
