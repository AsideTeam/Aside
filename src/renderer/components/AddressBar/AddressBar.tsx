import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, Search } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { createTab } from '../../lib/ipc-client'

/**
 * 주소창 + 네비게이션 버튼
 * 
 * 기능:
 * - URL 입력
 * - 네비게이션 (뒤로, 앞으로, 새로고침)
 * - URL 유효성 검사
 */
export function AddressBar() {
  const activeTab = useAppStore((state) =>
    state.tabs.find((t) => t.id === state.activeTabId)
  )

  const [url, setUrl] = useState(activeTab?.url || '')
  const [loading, setLoading] = useState(false)

  // 활성 탭이 변경되면 주소창 업데이트
  useEffect(() => {
    if (activeTab?.url) {
      setUrl(activeTab.url)
    }
  }, [activeTab?.id, activeTab?.url])

  const handleNavigate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) return

    // URL 정규화 (프로토콜 추가)
    let normalizedUrl = url
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      // 검색어인 경우 Google 검색
      if (!normalizedUrl.includes('.')) {
        normalizedUrl = `https://www.google.com/search?q=${encodeURIComponent(normalizedUrl)}`
      } else {
        normalizedUrl = `https://${normalizedUrl}`
      }
    }

    setLoading(true)
    try {
      await createTab(normalizedUrl)
    } catch (error) {
      console.error('Failed to navigate:', error)
      // 에러 처리는 createTab에서 수행
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleNavigate}
      className="address-bar bg-gray-800 flex items-center gap-2 px-4 py-2 h-12 border-b border-gray-700"
    >
      {/* 뒤로 버튼 */}
      <button
        type="button"
        disabled={loading}
        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
      >
        <ArrowLeft size={18} />
      </button>

      {/* 앞으로 버튼 */}
      <button
        type="button"
        disabled={loading}
        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
      >
        <ArrowRight size={18} />
      </button>

      {/* 새로고침 버튼 */}
      <button
        type="button"
        disabled={loading}
        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
      >
        <RotateCw size={18} />
      </button>

      {/* URL 입력 필드 */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Search or enter URL"
          disabled={loading}
          className="w-full px-3 py-2 pl-9 bg-gray-700 text-white rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <Search size={16} className="absolute left-3 top-2.5 text-gray-500" />
      </div>

      {/* Go 버튼 */}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
      >
        {loading ? '...' : 'Go'}
      </button>
    </form>
  )
}
