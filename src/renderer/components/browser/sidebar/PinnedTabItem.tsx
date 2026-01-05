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
      className={isActive ? 'sidebar-pinned-item sidebar-pinned-item--active' : 'sidebar-pinned-item'}
      title={title}
    >
      <div className="sidebar-pinned-item-left">
        <div className="sidebar-pinned-icon">
          {icon || (type === 'folder' ? <Folder size={14} /> : <Globe size={14} />)}
        </div>

        <span className="sidebar-pinned-title">
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
          className="sidebar-pinned-delete"
          aria-label="Delete"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
