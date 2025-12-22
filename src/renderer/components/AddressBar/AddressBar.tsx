import { useState, useEffect, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, X, Search, SlidersHorizontal, Star } from 'lucide-react'
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
    <div className="address-bar relative h-12 flex items-center px-4 bg-[#35363a] gap-4">
      {/* 1. 네비게이션 버튼 그룹 (왼쪽 - Chrome 순서: 뒤로 / 앞으로 / 새로고침) */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="p-2 text-[#9aa0a6] hover:bg-[#5f6368] rounded-full transition-colors disabled:opacity-30"
          title="뒤로"
        >
          <ArrowLeft size={18} />
        </button>

        <button
          type="button"
          onClick={handleForward}
          disabled={loading}
          className="p-2 text-[#9aa0a6] hover:bg-[#5f6368] rounded-full transition-colors disabled:opacity-30"
          title="앞으로"
        >
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={handleReload}
          className="p-2 text-[#9aa0a6] hover:bg-[#5f6368] rounded-full transition-colors disabled:opacity-30 mr-1"
          title={loading ? '중지' : '새로고침'}
        >
          {loading ? (
            <X size={18} />
          ) : (
            <RotateCw size={18} />
          )}
        </button>
      </div>

      {/* 2. Chrome 스타일 주소창 - 중앙 정렬 */}
      <form onSubmit={handleNavigate} className="flex-1 flex justify-center min-w-0">
        <div 
          className={`
            flex items-center h-10 px-4 rounded-full transition-all duration-200 w-full max-w-[1000px]
            ${isFocused 
              ? 'bg-[#202124] ring-2 ring-[#8ab4f8]/50 shadow-md' 
              : 'bg-[#202124] hover:bg-[#292a2d] shadow-sm'
            }
          `}
        >
          {/* 사이트 정보 아이콘 (Tune/Sliders 스타일) */}
          <div className="mr-2 shrink-0 p-1.5 hover:bg-[#5f6368]/30 rounded-full cursor-pointer transition-colors">
            <SlidersHorizontal size={14} className="text-[#9aa0a6]" />
          </div>
          
          <input
            type="text"
            value={isFocused ? url : displayUrl()}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Google에서 검색하거나 URL을 입력하세요."
            disabled={loading}
            className="flex-1 bg-transparent text-[15px] text-[#e8eaed] placeholder-[#9aa0a6] outline-none text-left"
          />

          {/* 우측 아이콘 (북마크 등 - 이미지 매칭) */}
          {!isFocused && url && (
            <div className="flex items-center gap-1 ml-2">
               <Star size={16} className="text-[#9aa0a6] hover:text-[#e8eaed] cursor-pointer" />
            </div>
          )}
        </div>
      </form>

      {/* 3. 오른쪽 균형을 위한 더미 스페이서 */}
      <div className="w-[108px] shrink-0 pointer-events-none" />
    </div>
  )
}
