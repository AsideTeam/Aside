import { useState } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { createTab, closeTab, switchTab } from '../../lib/ipc-client'

/**
 * 탭 표시 영역
 * - 현재 열린 탭 목록
 * - 활성 탭 강조
 * - 새 탭 버튼
 */
export function TabBar() {
  const tabs = useAppStore((state) => state.tabs)
  const activeTabId = useAppStore((state) => state.activeTabId)
  const [loading, setLoading] = useState(false)

  const handleTabClick = async (tabId: string) => {
    setLoading(true)
    try {
      await switchTab(tabId)
    } catch (error) {
      console.error('Failed to switch tab:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabClose = async (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
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
    <div className="tab-bar bg-gray-800 flex items-center gap-1 h-10 px-2 overflow-x-auto scrollbar-hide">
      {/* 기존 탭들 */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`
            flex items-center gap-2 px-3 py-1 rounded-t-lg cursor-pointer
            transition-all duration-200 whitespace-nowrap max-w-xs
            ${
              tab.id === activeTabId
                ? 'bg-gray-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
            }
          `}
        >
          {/* 탭 제목 */}
          <span className="text-sm truncate">{tab.title || 'Untitled'}</span>

          {/* 닫기 버튼 */}
          <button
            onClick={(e) => handleTabClose(e, tab.id)}
            disabled={loading}
            className="hover:bg-gray-600 p-0.5 rounded"
          >
            <X size={16} />
          </button>
        </div>
      ))}

      {/* 새 탭 버튼 */}
      <button
        onClick={handleNewTab}
        disabled={loading}
        className="ml-auto px-3 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
      >
        +
      </button>
    </div>
  )
}
