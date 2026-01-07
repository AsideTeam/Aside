/**
 * Sidebar Component - Advanced Drag & Drop
 * Multi-container: Icon ↔ Space ↔ Tab sections
 */

import React, { useMemo, useRef, useState } from 'react'
import { Plus, Download, Settings, MoreHorizontal } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { useTabs } from '@renderer/hooks'
import { logger } from '@renderer/lib/logger'
import { useOverlayStore } from '@renderer/lib/overlayStore'
import { cn } from '@renderer/styles'

import type { SidebarSection, SidebarTabItem } from './types'
import {
  SectionDropZone,
  SidebarDragOverlay,
  SortableIconTabItem,
  SortableSpaceItem,
  SortableTabItem,
} from './dnd'

export const Sidebar: React.FC = () => {
  const { tabs, activeTabId, createTab, closeTab, switchTab } = useTabs()
  const isOpen = useOverlayStore((s) => s.sidebarOpen)
  const isLatched = useOverlayStore((s) => s.sidebarLatched)
  const headerOpen = useOverlayStore((s) => s.headerOpen)
  const headerLatched = useOverlayStore((s) => s.headerLatched)

  const [activeId, setActiveId] = useState<string | null>(null)

  const { iconTabs, pinnedTabs, normalTabs, allTabs } = useMemo(() => {
    const all: SidebarTabItem[] = tabs
    return {
      allTabs: all,
      iconTabs: all.filter((t) => Boolean(t.isFavorite)),
      pinnedTabs: all.filter((t) => Boolean(t.isPinned) && !t.isFavorite),
      normalTabs: all.filter((t) => !t.isPinned && !t.isFavorite),
    }
  }, [tabs])

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const shouldPushDown = headerOpen || headerLatched
  const sidebarRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // reserved for future drop indicators
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    logger.info('[Sidebar DnD] handleDragEnd triggered', {
      activeId: active.id,
      overId: over?.id,
    })

    if (!over) {
      logger.info('[Sidebar DnD] No drop target, canceling')
      setActiveId(null)
      return
    }

    const activeSection = (active.data.current as { section?: SidebarSection } | undefined)?.section
    const overSection = (over.data.current as { section?: SidebarSection } | undefined)?.section

    logger.info('[Sidebar DnD] Sections detected', {
      activeSection,
      overSection,
      activeId: active.id,
      overId: over.id,
    })

    if (!activeSection || !overSection) {
      logger.warn('[Sidebar DnD] Missing type data, canceling')
      setActiveId(null)
      return
    }

    try {
      if (activeSection === overSection && active.id !== over.id) {
        const sectionList =
          activeSection === 'icon' ? iconTabs : activeSection === 'space' ? pinnedTabs : normalTabs
        const position = sectionList.findIndex((t) => t.id === (over.id as string))

        logger.info('[Sidebar DnD] Reorder within section', { section: activeSection, position })

        if (position !== -1) {
          await window.electronAPI?.invoke('tab:reorder', {
            tabId: active.id as string,
            position,
          })
          logger.info('[Sidebar DnD] Reorder success')
        }
      } else if (activeSection !== overSection) {
        logger.info('[Sidebar DnD] Move section', {
          from: activeSection,
          to: overSection,
          tabId: active.id,
        })

        await window.electronAPI?.invoke('tab:move-section', {
          tabId: active.id as string,
          targetType: overSection,
        })

        logger.info('[Sidebar DnD] Move section success')
      }
    } catch (error) {
      logger.error('[Sidebar DnD] Operation failed:', error)
    }

    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  return (
    <aside
      ref={sidebarRef}
      style={{
        pointerEvents: isOpen || isLatched ? 'auto' : 'none',
        width: '288px',
        top: shouldPushDown ? '56px' : '0',
        height: shouldPushDown ? 'calc(100% - 56px)' : '100%',
      }}
      className={cn(
        'fixed left-0 z-9999',
        'w-72',
        'bg-[#0E0F11]',
        'border-r border-white/5',
        'text-gray-300 text-sm',
        'transition-all duration-300 ease-out',
        '-translate-x-full',
        (isOpen || isLatched) && 'translate-x-0',
        'select-none',
        'flex flex-col'
      )}
      data-overlay-zone="sidebar"
      data-interactive="true"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* 1. ICON SECTION */}
        <div className="sidebar-icon-section">
          <SectionDropZone section="icon">
            <SortableContext items={iconTabs.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="sidebar-icon-grid">
                {iconTabs.map((t) => (
                  <SortableIconTabItem key={t.id} tab={t} onSelect={() => void switchTab(t.id)} />
                ))}
              </div>
            </SortableContext>
          </SectionDropZone>
        </div>

        {/* 2. SPACE SECTION */}
        <div className="sidebar-space-section">
          <SectionDropZone section="space">
            <div className="sidebar-space-header">
              <span className="sidebar-space-title">Space</span>
              <button className="sidebar-space-menu">
                <MoreHorizontal size={14} />
              </button>
            </div>
            <SortableContext items={pinnedTabs.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="sidebar-space-list">
                {pinnedTabs.map((t) => (
                  <SortableSpaceItem
                    key={t.id}
                    tab={t}
                    isActive={t.id === activeTabId}
                    onSelect={() => void switchTab(t.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </SectionDropZone>
        </div>

        {/* 3. TAB SECTION */}
        <div className="sidebar-tab-section">
          <button className="sidebar-new-tab" onClick={() => void createTab()}>
            <div className="sidebar-new-tab-icon">
              <Plus size={14} />
            </div>
            <span>New Tab</span>
          </button>

          <div className="sidebar-tab-divider" />

          <SectionDropZone section="tab">
            <SortableContext items={normalTabs.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="sidebar-tab-list">
                {normalTabs.map((t) => (
                  <SortableTabItem
                    key={t.id}
                    tab={t}
                    isActive={t.id === activeTabId}
                    onSelect={() => void switchTab(t.id)}
                    onClose={() => void closeTab(t.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </SectionDropZone>
        </div>

        <SidebarDragOverlay activeId={activeId} tabs={allTabs} />
      </DndContext>

      {/* 4. FOOTER */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-left">
          <button className="sidebar-footer-btn" title="Settings">
            <Settings size={16} />
          </button>
        </div>
        <div className="sidebar-footer-right">
          <button className="sidebar-footer-btn" title="Downloads">
            <Download size={16} />
          </button>
          <button className="sidebar-footer-btn" title="New Tab" onClick={() => void createTab()}>
            <Plus size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
