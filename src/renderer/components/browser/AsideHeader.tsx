import React from 'react'
import { AddressBar } from './AddressBar'
import { Pin, PanelLeft, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { useOverlayStore } from '@renderer/lib/overlayStore'
import { useWebContents } from '@renderer/hooks'

export const AsideHeader: React.FC = () => {
  const isOpen = useOverlayStore((s) => s.headerOpen)
  const isHeaderLatched = useOverlayStore((s) => s.headerLatched)
  const isSidebarLatched = useOverlayStore((s) => s.sidebarLatched)
  const toggleHeaderLatch = useOverlayStore((s) => s.toggleHeaderLatch)
  const toggleSidebarLatch = useOverlayStore((s) => s.toggleSidebarLatch)
  
  const web = useWebContents()

  const headerClass =
    (isOpen ? 'aside-header aside-header--open' : 'aside-header') +
    (isHeaderLatched ? ' aside-header--pinned' : '')
  
  const sidebarBtnClass = isSidebarLatched 
    ? 'aside-header-btn aside-header-btn--active' 
    : 'aside-header-btn'
    
  const headerBtnClass = isHeaderLatched 
    ? 'aside-header-btn aside-header-btn--active' 
    : 'aside-header-btn'

  return (
    <div className={headerClass} data-overlay-zone="header" data-interactive="true">
      <div className="aside-header-surface">
        
        {/* 1. 좌측 네비게이션 (Traffic Light 옆) */}
        <div className="aside-header-nav">
          <button 
            className="aside-header-btn"
            onClick={web.goBack}
            disabled={!web.canGoBack}
            title="뒤로"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            className="aside-header-btn"
            onClick={web.goForward}
            disabled={!web.canGoForward}
            title="앞으로"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button 
            className="aside-header-btn"
            onClick={web.reload}
            disabled={web.isLoading}
            title="새로고침"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* 2. 중앙 URLBar */}
        <AddressBar wrapperClassName="aside-header-addressbar" inputClassName="aside-header-input" />

        {/* 3. 우측 액션 버튼 */}
        <div className="aside-header-actions">
          <button 
            onClick={toggleSidebarLatch} 
            className={sidebarBtnClass}
            title={isSidebarLatched ? '사이드바 고정 해제 (Cmd/Ctrl+B)' : '사이드바 고정 (Cmd/Ctrl+B)'}
          >
             <PanelLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={toggleHeaderLatch} 
            className={headerBtnClass}
            title={isHeaderLatched ? '주소바 고정 해제 (Cmd/Ctrl+L)' : '주소바 고정 (Cmd/Ctrl+L)'}
          >
             <Pin className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  )
}

