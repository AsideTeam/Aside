import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { getFaviconUrl } from '@renderer/lib/faviconUtils'

import type { SidebarTabItem } from '../types'

export function SortableIconTabItem({
  tab,
  onSelect,
}: {
  tab: SidebarTabItem
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
      className="sidebar-icon-item"
      onClick={onSelect}
      title={tab.title || tab.url}
      {...attributes}
      {...listeners}
    >
      <img
        src={getFaviconUrl(tab.url, tab.favicon)}
        alt=""
        className="w-8 h-8 object-contain rounded-md"
      />
    </button>
  )
}
