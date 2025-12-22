import { useState, type MouseEvent } from 'react'
import { X, Plus } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { createTab, closeTab, switchTab } from '../../lib/ipc-client'

/**
 * 탭바 - Chrome/Zen 하이브리드 스타일
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
    <div className="tab-bar h-10 flex items-end bg-[#202124] select-none drag pt-2">
      {/* macOS 신호등 버튼 영역 (왼쪽 여백) - 네이티브 타이틀바 복구로 제거됨 */}
      {/* <div className="w-19.5 h-full shrink-0" /> */}
      
      {/* 탭 목록 */}
      <div className="flex items-end h-full overflow-x-auto scrollbar-hide no-drag px-2 gap-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          return (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                group relative flex items-center h-[34px] px-3 rounded-t-lg cursor-pointer
                transition-all duration-150 flex-1 min-w-30 max-w-60
                ${isActive 
                  ? 'bg-[#35363a] text-[#e8eaed]' 
                  : 'bg-transparent text-[#9aa0a6] hover:bg-[#35363a]/30'
                }
              `}
            >
              {/* 구분선 (비활성 탭 사이) - 복잡해서 일단 제외하고 간격으로 처리 */}

              {/* 탭 제목 */}
              <span className="text-[12px] truncate flex-1 pr-1 font-medium">
                {tab.title || 'New Tab'}
              </span>

              {/* 닫기 버튼 */}
              <button
                onClick={(e) => handleTabClose(e, tab.id)}
                disabled={loading}
                className={`
                  shrink-0 w-7 h-7 flex items-center justify-center
                  rounded-full transition-all
                  ${isActive 
                    ? 'opacity-100 hover:bg-[#4a4c50]' 
                    : 'opacity-0 group-hover:opacity-100 hover:bg-[#4a4c50]'
                  }
                `}
              >
                <X size={16} />
              </button>
            </div>
          )
        })}

        {/* 새 탭 버튼 */}
        <button
          onClick={handleNewTab}
          disabled={loading}
          className="h-9 w-9 flex items-center justify-center text-[#9aa0a6] hover:bg-[#35363a] rounded-full transition-colors ml-1"
          title="새 탭"
        >
          <Plus size={22} />
        </button>
      </div>
    </div>
  )
}