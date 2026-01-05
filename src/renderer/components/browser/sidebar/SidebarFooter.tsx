/**
 * SidebarFooter Component
 *
 * 사이드바 하단 푸터 (다운로드/설정/추가)
 */

import React from 'react'
import { cn } from '@renderer/styles'
import { Download, Plus, Settings } from 'lucide-react'

interface SidebarFooterProps {
  onDownloadsClick?: () => void
  onSettingsClick?: () => void
  onAddClick?: () => void
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  onDownloadsClick,
  onSettingsClick,
  onAddClick,
}) => {
  return (
    <div className={cn(
      'h-14 mt-auto border-t border-white/5',
      'flex items-center justify-between px-3 py-2',
      'bg-[#0E0F11]'
    )}>
      {/* Left Group */}
      <div className="flex items-center gap-1">
        <button
          onClick={onSettingsClick}
          className={cn(
            'p-2 rounded-lg',
            'text-gray-500 hover:text-gray-300',
            'hover:bg-white/5',
            'transition-colors',
            'group'
          )}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Right Group */}
      <div className="flex items-center gap-1">
        <button
          onClick={onDownloadsClick}
          className={cn(
            'p-2 rounded-lg',
            'text-gray-500 hover:text-gray-300',
            'hover:bg-white/5',
            'transition-colors',
            'group'
          )}
          title="Downloads"
        >
          <Download size={18} />
        </button>

        <button
          onClick={onAddClick}
          className={cn(
            'p-2 rounded-lg',
            'text-gray-500 hover:text-gray-300',
            'hover:bg-white/5',
            'transition-colors',
            'group'
          )}
          title="Add Space"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}
