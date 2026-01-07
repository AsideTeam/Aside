import React from 'react'
import { useDroppable } from '@dnd-kit/core'

import { cn } from '@renderer/styles'

import type { SidebarSection } from '../types'

export function SectionDropZone({
  section,
  children,
}: {
  section: SidebarSection
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section:${section}`,
    data: { kind: 'section', section },
  })

  return (
    <div ref={setNodeRef} className={cn(isOver && 'ring-1 ring-white/10')}>
      {children}
    </div>
  )
}
