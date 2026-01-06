/**
 * Sidebar Component - Advanced Drag & Drop
 * Multi-container: Icon ↔ Space ↔ Tab sections
 */

import React, { useRef, useState } from 'react'
import { Plus, Download, Settings, MoreHorizontal, Globe, X } from 'lucide-react'
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent,
  DragOverlay,
  DragOverEvent,
  rectIntersection
} from '@dnd-kit/core'
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useOverlayStore } from '@renderer/lib/overlayStore'
import { cn } from '@renderer/styles'
import { useTabs } from '@renderer/hooks'
import { getFaviconUrl } from '@renderer/lib/faviconUtils'

// Icon section apps (3x2 grid = 6 items)
const ICON_APPS = [
  { id: 'gmail', name: 'Gmail', url: 'https://mail.google.com' },
  { id: 'drive', name: 'Drive', url: 'https://drive.google.com' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' },
  { id: 'github', name: 'GitHub', url: 'https://github.com' },
  { id: 'youtube', name: 'YouTube', url: 'https://youtube.com' },
  { id: 'chess', name: 'Chess', url: 'https://chess.com' },
]

type TabItem = {
  id: string
  title?: string
  favicon?: string
  url: string
  isPinned?: boolean
}

// Sortable Icon Item
function SortableIconItem({ 
  app, 
  onClick 
}: { 
  app: { id: string; name: string; url: string }
  onClick: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id, data: { type: 'icon' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      className="sidebar-icon-item"
      onClick={onClick}
      title={app.name}
      {...attributes}
      {...listeners}
    >
      <img 
        src={getFaviconUrl(app.url)} 
        alt={app.name}
        className="w-8 h-8 object-contain rounded-md"
      />
    </button>
  )
}

// Sortable Space Item
function SortableSpaceItem({ 
  tab, 
  isActive, 
  onSelect 
}: { 
  tab: TabItem
  isActive: boolean
  onSelect: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id, data: { type: 'space' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'sidebar-space-item',
        isActive && 'sidebar-space-item--active'
      )}
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

// Sortable Tab Item
function SortableTabItem({ 
  tab, 
  isActive, 
  onSelect, 
  onClose 
}: { 
  tab: TabItem
  isActive: boolean
  onSelect: () => void
  onClose: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id, data: { type: 'tab' } })

  const style = {
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
        isActive && 'sidebar-tab-item--active'
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

export const Sidebar: React.FC = () => {
  const { tabs, activeTabId, createTab, closeTab, switchTab } = useTabs()
  const isOpen = useOverlayStore((s) => s.sidebarOpen)
  const isLatched = useOverlayStore((s) => s.sidebarLatched)
  const headerOpen = useOverlayStore((s) => s.headerOpen)
  const headerLatched = useOverlayStore((s) => s.headerLatched)

  const [activeId, setActiveId] = useState<string | null>(null)

  // Separate sections
  const pinnedTabs = tabs.filter((t: unknown) => (t as TabItem).isPinned)
  const normalTabs = tabs.filter((t: unknown) => !(t as TabItem).isPinned)


  const shouldPushDown = headerOpen || headerLatched
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Can use over state for drop indicators later
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    const activeData = active.data.current
    const overData = over.data.current

    // Same container reorder
    if (activeData?.type === overData?.type && active.id !== over.id) {
      await window.electronAPI?.invoke('tab:reorder', { 
        tabId: active.id, 
        targetId: over.id 
      })
    }
    
    // Cross-container move
    else if (activeData?.type !== overData?.type) {
      const targetSection = overData?.type || 'tab'
      await window.electronAPI?.invoke('tab:move-section', { 
        tabId: active.id, 
        section: targetSection 
      })
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
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* 1. ICON SECTION */}
        <div className="sidebar-icon-section">
          <SortableContext items={ICON_APPS.map(a => a.id)} strategy={verticalListSortingStrategy}>
            <div className="sidebar-icon-grid">
              {ICON_APPS.map((app) => (
                <SortableIconItem
                  key={app.id}
                  app={app}
                  onClick={() => void createTab(app.url)}
                />
              ))}
            </div>
          </SortableContext>
        </div>

        {/* 2. SPACE SECTION */}
        {pinnedTabs.length > 0 && (
          <div className="sidebar-space-section">
            <div className="sidebar-space-header">
              <span className="sidebar-space-title">Space</span>
              <button className="sidebar-space-menu">
                <MoreHorizontal size={14} />
              </button>
            </div>
            <SortableContext items={pinnedTabs.map((t: unknown) => (t as TabItem).id)} strategy={verticalListSortingStrategy}>
              <div className="sidebar-space-list">
                {pinnedTabs.map((tab: unknown) => {
                  const t = tab as TabItem
                  return (
                    <SortableSpaceItem
                      key={t.id}
                      tab={t}
                      isActive={t.id === activeTabId}
                      onSelect={() => void switchTab(t.id)}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </div>
        )}

        {/* 3. TAB SECTION */}
        <div className="sidebar-tab-section">
          <button
            className="sidebar-new-tab"
            onClick={() => void createTab()}
          >
            <div className="sidebar-new-tab-icon">
              <Plus size={14} />
            </div>
            <span>New Tab</span>
          </button>

          <div className="sidebar-tab-divider" />

          <SortableContext items={normalTabs.map((t: unknown) => (t as TabItem).id)} strategy={verticalListSortingStrategy}>
            <div className="sidebar-tab-list">
              {normalTabs.map((tab: unknown) => {
                const t = tab as TabItem
                return (
                  <SortableTabItem
                    key={t.id}
                    tab={t}
                    isActive={t.id === activeTabId}
                    onSelect={() => void switchTab(t.id)}
                    onClose={() => void closeTab(t.id)}
                  />
                )
              })}
            </div>
          </SortableContext>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="sidebar-tab-item opacity-90 bg-white/10">
              <div className="sidebar-tab-left">
                <div className="sidebar-tab-favicon">
                  <Globe size={12} />
                </div>
                <span className="sidebar-tab-title">Dragging...</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
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
          <button 
            className="sidebar-footer-btn" 
            title="New Tab"
            onClick={() => void createTab()}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
