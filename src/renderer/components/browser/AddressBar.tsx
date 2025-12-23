import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { useWebContents } from '@renderer/hooks'
import { cn } from '@renderer/styles'
import { formatUrl } from '@renderer/lib/utils'

interface AddressBarProps {
  wrapperClassName?: string
  inputClassName?: string

  // BrowserLayout(일반 레이아웃)에서 제어형으로 쓰고 싶을 때
  currentUrl?: string
  onNavigate?: (url: string) => void
  onReload?: () => void
  onGoBack?: () => void
  onGoForward?: () => void
  canGoBack?: boolean
  canGoForward?: boolean
  isLoading?: boolean
}

export function AddressBar({
  wrapperClassName,
  inputClassName,
  currentUrl: currentUrlProp,
  onNavigate,
  onReload,
  onGoBack,
  onGoForward,
  canGoBack: canGoBackProp,
  canGoForward: canGoForwardProp,
  isLoading: isLoadingProp,
}: AddressBarProps) {
  const web = useWebContents()

  const currentUrl = currentUrlProp ?? web.currentUrl
  const navigate = onNavigate ?? web.navigate
  const goBack = onGoBack ?? web.goBack
  const goForward = onGoForward ?? web.goForward
  const reload = onReload ?? web.reload

  const canGoBack = canGoBackProp ?? web.canGoBack
  const canGoForward = canGoForwardProp ?? web.canGoForward
  const isLoading = isLoadingProp ?? web.isLoading

  const [inputValue, setInputValue] = useState(currentUrl)

  useEffect(() => {
    setInputValue(currentUrl)
  }, [currentUrl])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(formatUrl(inputValue.trim()))
  }

  return (
    <div className={cn('flex items-center gap-2 w-full', wrapperClassName)}>
      <div className="flex items-center gap-1">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="뒤로"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="앞으로"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={reload}
          disabled={isLoading}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="새로고침"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 min-w-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="주소 입력..."
          className={cn(
            'w-full px-3 py-0.5 bg-transparent text-sm focus:outline-none transition-colors placeholder:text-gray-500',
            inputClassName,
          )}
          style={{ height: '32px' }}
        />
      </form>
    </div>
  )
}
