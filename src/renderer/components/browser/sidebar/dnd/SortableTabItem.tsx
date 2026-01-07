import React from 'react'
import { X } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '@renderer/styles'
import { getFaviconUrl } from '@renderer/lib/faviconUtils'

import type { SidebarTabItem } from '../types'

export function SortableTabItem({
  tab,
  isActive,
  onSelect,
  onClose,
  isOverlay,
}: {
  tab: SidebarTabItem
  isActive: boolean
  onSelect: () => void
  onClose: () => void
  isOverlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
    data: { kind: 'item', section: 'tab' },
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'sidebar-tab-item',
        isActive && 'sidebar-tab-item--active',
        isOverlay && 'opacity-90 bg-[#2B2D31] shadow-xl scale-105 border border-white/10'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="sidebar-tab-left" onClick={onSelect}>
        <div className="sidebar-tab-favicon">
          <img
            src={getFaviconUrl(tab.url, tab.favicon)}
            alt=""
            className="w-3 h-3 object-contain rounded-sm"
          />
        </div>
        <span className="sidebar-tab-title">{tab.title || 'Loading...'}</span>
      </div>
      <button
        className="sidebar-tab-close"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
