import React from 'react'
import { Globe } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '@renderer/styles'

import type { SidebarTabItem } from '../types'

export function SortableSpaceItem({
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
    data: { kind: 'item', section: 'space' },
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
      className={cn('sidebar-space-item', isActive && 'sidebar-space-item--active')}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      <div className="sidebar-space-icon">
        <Globe size={16} />
      </div>
      <span className="sidebar-space-text">{tab.title || 'Untitled'}</span>
    </div>
  )
}
