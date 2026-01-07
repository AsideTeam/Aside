import { DragOverlay } from '@dnd-kit/core'

import { getFaviconUrl } from '@renderer/lib/faviconUtils'

import type { SidebarTabItem } from '../types'

export function SidebarDragOverlay({
  activeId,
  tabs,
}: {
  activeId: string | null
  tabs: SidebarTabItem[]
}) {
  return (
    <DragOverlay
      dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}
    >
      {activeId ? (
        (() => {
          const activeTab = tabs.find((t) => t.id === activeId)
          if (!activeTab) return null

          const isIcon = Boolean(activeTab.isFavorite)

          return isIcon ? (
            <button className="sidebar-icon-item opacity-90 scale-110 shadow-xl bg-[#2B2D31]">
              <img
                src={getFaviconUrl(activeTab.url, activeTab.favicon)}
                alt=""
                className="w-8 h-8 object-contain rounded-md"
              />
            </button>
          ) : (
            <div className="sidebar-tab-item opacity-90 bg-[#2B2D31] shadow-xl scale-105 border border-white/10">
              <div className="sidebar-tab-left">
                <div className="sidebar-tab-favicon">
                  <img
                    src={getFaviconUrl(activeTab.url, activeTab.favicon)}
                    alt=""
                    className="w-3 h-3 object-contain rounded-sm"
                  />
                </div>
                <span className="sidebar-tab-title">{activeTab.title || 'Loading...'}</span>
              </div>
            </div>
          )
        })()
      ) : null}
    </DragOverlay>
  )
}
