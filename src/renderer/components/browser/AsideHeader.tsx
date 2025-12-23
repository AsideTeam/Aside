import React, { useEffect, useState } from 'react'
import { AddressBar } from './AddressBar'
import { Pin, PanelLeft } from 'lucide-react'

export const AsideHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isHeaderLatched, setIsHeaderLatched] = useState(false)
  const [isSidebarLatched, setIsSidebarLatched] = useState(false)

  useEffect(() => {
    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)
    const headerLatch = (data: any) => setIsHeaderLatched(Boolean(data?.latched))
    const sidebarLatch = (data: any) => setIsSidebarLatched(Boolean(data?.latched))

    try {
      window.electronAPI?.on('header:open', open)
      window.electronAPI?.on('header:close', close)
      window.electronAPI?.on('header:latch-changed', headerLatch)
      window.electronAPI?.on('sidebar:latch-changed', sidebarLatch)
    } catch {
      // ignore
    }

    return () => {
      try {
        window.electronAPI?.off('header:open', open)
        window.electronAPI?.off('header:close', close)
        window.electronAPI?.off('header:latch-changed', headerLatch)
        window.electronAPI?.off('sidebar:latch-changed', sidebarLatch)
      } catch {
        // ignore
      }
    }
  }, [])

  const toggleHeaderLatch = async () => {
    try {
      const result: any = await window.electronAPI.invoke('overlay:toggle-header-latch')
      if (result?.success) setIsHeaderLatched(Boolean(result.latched))
    } catch {
      // ignore
    }
  }

  const toggleSidebarLatch = async () => {
    try {
      const result: any = await window.electronAPI.invoke('overlay:toggle-sidebar-latch')
      if (result?.success) setIsSidebarLatched(Boolean(result.latched))
    } catch {
      // ignore
    }
  }

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
