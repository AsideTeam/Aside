import { useState, type MouseEvent } from 'react'
import { X, Plus } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { createTab, closeTab, switchTab } from '../../lib/ipc-client'

/**
 * 탭바 - 크롬 스타일
 * macOS: 왼쪽 78px는 신호등 버튼 영역으로 비움
 */
export function TabBar() {
  const tabs = useAppStore((state) => state.tabs)
  const activeTabId = useAppStore((state) => state.activeTabId)
  const [loading, setLoading] = useState(false)

  const handleTabClick = async (tabId: string) => {
    if (loading) return
    setLoading(true)
    try {
      await switchTab(tabId)
    } catch (error) {
      console.error('Failed to switch tab:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabClose = async (e: MouseEvent, tabId: string) => {
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      await closeTab(tabId)
    } catch (error) {
      console.error('Failed to close tab:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewTab = async () => {
    if (loading) return
    setLoading(true)
    try {
      await createTab('https://www.google.com')
    } catch (error) {
      console.error('Failed to create tab:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tab-bar h-10 flex items-end bg-[#202124] select-none drag">
      {/* macOS 신호등 버튼 영역 (왼쪽 여백) */}
      <div className="w-[78px] h-full flex-shrink-0" />
      
      {/* 탭 목록 */}
      <div className="flex items-end gap-0.5 overflow-x-auto scrollbar-hide no-drag">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          return (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                group flex items-center gap-2 h-8 px-3 rounded-t-lg cursor-pointer
                transition-colors duration-150 max-w-[200px] min-w-[100px]
                ${isActive 
                  ? 'bg-[#35363a] text-[#e8eaed]' 
                  : 'bg-transparent text-[#9aa0a6] hover:bg-[#35363a]/50'
                }
              `}
            >
              {/* 탭 제목 */}
              <span className="text-[13px] truncate flex-1">
                {tab.title || 'New Tab'}
              </span>

              {/* 닫기 버튼 */}
              <button
                onClick={(e) => handleTabClose(e, tab.id)}
                disabled={loading}
                className={`
                  p-0.5 rounded-sm transition-colors
                  ${isActive 
                    ? 'opacity-100' 
                    : 'opacity-0 group-hover:opacity-100'
                  }
                  hover:bg-[#5f6368]
                `}
              >
                <X size={14} />
              </button>
            </div>
          )
        })}

        {/* 새 탭 버튼 */}
        <button
          onClick={handleNewTab}
          disabled={loading}
          className="h-8 w-8 flex items-center justify-center text-[#9aa0a6] hover:bg-[#35363a]/50 rounded-full transition-colors ml-1"
          title="새 탭"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}