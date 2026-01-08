import React from 'react'
import { X } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '@renderer/styles'
import { getFaviconUrl } from '@renderer/lib/faviconUtils'
import { useI18n } from '@renderer/hooks'

import type { SidebarTabItem } from '../types'

export function SortableSpaceItem({
  tab,
  isActive,
  onSelect,
  onClose,
}: {
  tab: SidebarTabItem
  isActive: boolean
  onSelect: () => void
  onClose: () => void
}) {
  const { t } = useI18n()
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
      <div className="sidebar-space-favicon">
        <img
          src={getFaviconUrl(tab.url, tab.favicon)}
          alt=""
        />
      </div>
      <span className="sidebar-space-text">{tab.title || t('tab.untitled')}</span>

      <button
        className="sidebar-space-close"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label={t('action.close')}
        title={t('action.close')}
      >
        <X size={14} />
      </button>
    </div>
  )
}
