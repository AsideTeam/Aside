import { useState, useEffect, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, X, Search, Lock } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { navigate, goBack, goForward, reload } from '../../lib/ipc-client'

/**
 * 주소창 - Zen Browser 스타일 (Floating Pill)
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
    <div className="address-bar h-14 flex items-center justify-center px-4 bg-transparent">
      {/* macOS 신호등 버튼 영역 (왼쪽 여백) */}
      <div className="w-20 flex-shrink-0" />
      
      {/* Zen 스타일: Floating Pill Container */}
      <div className="flex-1 flex items-center justify-center">
        <form
          onSubmit={handleNavigate}
          className="flex items-center gap-3 w-full max-w-[700px]"
        >
          {/* 네비게이션 버튼 그룹 - 왼쪽 */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="p-2 text-[#9aa0a6] hover:bg-white/5 rounded-lg transition-all disabled:opacity-30"
              title="뒤로"
            >
              <ArrowLeft size={16} />
            </button>

            <button
              type="button"
              onClick={handleForward}
              disabled={loading}
              className="p-2 text-[#9aa0a6] hover:bg-white/5 rounded-lg transition-all disabled:opacity-30"
              title="앞으로"
            >
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={handleReload}
              className="p-2 text-[#9aa0a6] hover:bg-white/5 rounded-lg transition-all disabled:opacity-30"
              title={loading ? '중지' : '새로고침'}
            >
              {loading ? (
                <X size={16} />
              ) : (
                <RotateCw size={16} />
              )}
            </button>
          </div>

          {/* Floating Pill URL 입력 필드 - Zen 스타일 */}
          <div 
            className={`
              flex-1 flex items-center h-9 px-4 rounded-xl transition-all duration-200
              ${isFocused 
                ? 'bg-[#1e1e2e]/90 ring-2 ring-[#cba6f7]/30 shadow-lg shadow-[#cba6f7]/10 backdrop-blur-xl transform translate-y-[1px]' 
                : 'bg-white/[0.08] hover:bg-white/[0.10] backdrop-blur-md'
              }
              border border-white/10 shadow-md
            `}
          >
            {/* 보안 아이콘 */}
            {isSecure && !isFocused && (
              <Lock size={13} className="text-[#a6adc8] mr-2.5 flex-shrink-0" />
            )}
            {!isSecure && !isFocused && url && (
              <Search size={13} className="text-[#a6adc8] mr-2.5 flex-shrink-0" />
            )}
            
            <input
              type="text"
              value={isFocused ? url : displayUrl()}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search or type a URL"
              disabled={loading}
              className={`
                flex-1 bg-transparent text-[13px] text-[#cdd6f4] placeholder-[#6c7086] outline-none
                ${!isFocused ? 'text-center' : ''}
              `}
            />
          </div>
        </form>
      </div>

      {/* 오른쪽 여백 (대칭) */}
      <div className="w-20 flex-shrink-0" />
    </div>
  )
}
