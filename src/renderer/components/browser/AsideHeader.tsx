import React from 'react'
import { AddressBar } from './AddressBar'
import { Pin, PanelLeft } from 'lucide-react'
import { useOverlayStore } from '@renderer/lib/overlayStore'

export const AsideHeader: React.FC = () => {
  const isOpen = useOverlayStore((s) => s.headerOpen)
  const isHeaderLatched = useOverlayStore((s) => s.headerLatched)
  const isSidebarLatched = useOverlayStore((s) => s.sidebarLatched)
  const toggleHeaderLatch = useOverlayStore((s) => s.toggleHeaderLatch)
  const toggleSidebarLatch = useOverlayStore((s) => s.toggleSidebarLatch)

  return (
    <div className={isOpen ? 'aside-header aside-header--open' : 'aside-header'}>
      <div className="aside-header-surface">
        <AddressBar wrapperClassName="flex-1 min-w-0" inputClassName="aside-header-input" />

        <button
          type="button"
          onClick={toggleSidebarLatch}
          className={
            isSidebarLatched
              ? 'p-1.5 rounded hover:bg-white/10 transition-colors text-white'
              : 'p-1.5 rounded hover:bg-white/10 transition-colors text-white/70'
          }
          title={isSidebarLatched ? '사이드바 고정 해제 (Cmd/Ctrl+B)' : '사이드바 고정 (Cmd/Ctrl+B)'}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={toggleHeaderLatch}
          className={
            isHeaderLatched
              ? 'p-1.5 rounded hover:bg-white/10 transition-colors text-white'
              : 'p-1.5 rounded hover:bg-white/10 transition-colors text-white/70'
          }
          title={isHeaderLatched ? '주소바 고정 해제 (Cmd/Ctrl+L)' : '주소바 고정 (Cmd/Ctrl+L)'}
        >
          <Pin className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
