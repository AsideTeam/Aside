import { useState, useEffect, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, X, Search, Lock } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { navigate, goBack, goForward, reload } from '../../lib/ipc-client'

/**
 * 주소창 - 크롬 스타일
 */
export function AddressBar() {
  const activeTab = useAppStore((state) =>
    state.tabs.find((t) => t.id === state.activeTabId)
  )

  const [url, setUrl] = useState(activeTab?.url || '')
  const [isFocused, setIsFocused] = useState(false)
  const [loading, setLoading] = useState(false)

  // 활성 탭이 변경되면 주소창 업데이트
  useEffect(() => {
    if (activeTab?.url) {
      setUrl(activeTab.url)
    }
  }, [activeTab?.id, activeTab?.url])

  const handleNavigate = async (e: FormEvent) => {
    e.preventDefault()
    if (!url.trim() || loading) return

    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      if (!normalizedUrl.includes('.')) {
        normalizedUrl = `https://www.google.com/search?q=${encodeURIComponent(normalizedUrl)}`
      } else {
        normalizedUrl = `https://${normalizedUrl}`
      }
    }

    setLoading(true)
    try {
      await navigate(normalizedUrl)
    } catch (error) {
      console.error('Failed to navigate:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = async () => {
    try {
      await goBack()
    } catch (error) {
      console.error('Failed to go back:', error)
    }
  }

  const handleForward = async () => {
    try {
      await goForward()
    } catch (error) {
      console.error('Failed to go forward:', error)
    }
  }

  const handleReload = async () => {
    if (loading) {
      // 로딩 중이면 중지 (실제 구현 필요)
      return
    }
    try {
      setLoading(true)
      await reload()
    } catch (error) {
      console.error('Failed to reload:', error)
    } finally {
      setLoading(false)
    }
  }

  // URL에서 도메인만 추출 (표시용)
  const displayUrl = () => {
    if (isFocused) return url
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
    }
  }

  const isSecure = url.startsWith('https://')

  return (
    <form
      onSubmit={handleNavigate}
      className="address-bar h-12 flex items-center gap-1 px-2 bg-[#35363a]"
    >
      {/* 네비게이션 버튼 그룹 */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="p-2 text-[#9aa0a6] hover:bg-[#4a4b4f] rounded-full transition-colors disabled:opacity-40"
          title="뒤로"
        >
          <ArrowLeft size={18} />
        </button>

        <button
          type="button"
          onClick={handleForward}
          disabled={loading}
          className="p-2 text-[#9aa0a6] hover:bg-[#4a4b4f] rounded-full transition-colors disabled:opacity-40"
          title="앞으로"
        >
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={handleReload}
          className="p-2 text-[#9aa0a6] hover:bg-[#4a4b4f] rounded-full transition-colors disabled:opacity-40"
          title={loading ? '중지' : '새로고침'}
        >
          {loading ? (
            <X size={18} />
          ) : (
            <RotateCw size={18} />
          )}
        </button>
      </div>

      {/* URL 입력 필드 - 크롬 스타일 */}
      <div className="flex-1 mx-2">
        <div 
          className={`
            flex items-center h-8 px-3 rounded-full transition-all
            ${isFocused 
              ? 'bg-[#202124] ring-2 ring-[#8ab4f8]' 
              : 'bg-[#202124] hover:bg-[#292a2d]'
            }
          `}
        >
          {/* 보안 아이콘 */}
          {isSecure && !isFocused && (
            <Lock size={14} className="text-[#9aa0a6] mr-2 flex-shrink-0" />
          )}
          {!isSecure && !isFocused && url && (
            <Search size={14} className="text-[#9aa0a6] mr-2 flex-shrink-0" />
          )}
          
          <input
            type="text"
            value={isFocused ? url : displayUrl()}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="검색어 또는 URL 입력"
            disabled={loading}
            className="flex-1 bg-transparent text-[14px] text-[#e8eaed] placeholder-[#9aa0a6] outline-none"
          />
        </div>
      </div>
    </form>
  )
}
