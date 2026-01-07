import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { getFaviconUrl } from '@renderer/lib/faviconUtils'
import { cn } from '@renderer/styles'

import type { SidebarTabItem } from '../types'

export function SortableIconTabItem({
  tab,
  isActive,
  onSelect,
}: {
  tab: SidebarTabItem
  isActive: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
    data: { kind: 'item', section: 'icon' },
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      className={cn('sidebar-icon-item', isActive && 'sidebar-icon-item--active')}
      onClick={onSelect}
      title={tab.title || tab.url}
      {...attributes}
      {...listeners}
    >
      <img
        src={getFaviconUrl(tab.url, tab.favicon)}
        alt=""
        className="sidebar-icon-img"
      />
    </button>
  )
}
