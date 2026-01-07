import React, { useEffect, useState } from 'react'
import { cn } from '@renderer/styles'
import type { SettingsSchema } from '@shared/types'
import { formatUrl } from '@renderer/lib/utils'
import { useAppSettings } from '@renderer/hooks/settings/useAppSettings'

function buildSearchUrl(engine: SettingsSchema['searchEngine'], query: string): string {
  const q = encodeURIComponent(query)
  switch (engine) {
    case 'naver':
      return `https://search.naver.com/search.naver?query=${q}`
    case 'bing':
      return `https://www.bing.com/search?q=${q}`
    case 'duckduckgo':
      return `https://duckduckgo.com/?q=${q}`
    case 'google':
    default:
      return `https://www.google.com/search?q=${q}`
  }
}

function looksLikeUrl(input: string): boolean {
  if (!input) return false
  if (input.includes('://')) return true
  if (input.startsWith('about:') || input.startsWith('chrome:') || input.startsWith('mailto:')) return true
  if (input.includes(' ')) return false
  if (input.startsWith('localhost')) return true
  if (/^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?(?:\/|$)/.test(input)) return true
  return input.includes('.')
}

function formatOmniboxInput(input: string, searchEngine: SettingsSchema['searchEngine']): string {
  const trimmed = input.trim()
  if (!trimmed) return 'about:blank'
  return looksLikeUrl(trimmed) ? formatUrl(trimmed) : buildSearchUrl(searchEngine, trimmed)
}

interface AddressBarProps {
  wrapperClassName?: string
  inputClassName?: string
  currentUrl?: string
  onNavigate?: (url: string) => void
}

export function AddressBar({
  wrapperClassName,
  inputClassName,
  currentUrl: currentUrlProp,
  onNavigate,
}: AddressBarProps) {
  const { settings } = useAppSettings()
  const [inputValue, setInputValue] = useState(currentUrlProp ?? settings?.homepage ?? 'https://www.google.com')

  useEffect(() => {
    if (currentUrlProp) {
      setInputValue(currentUrlProp)
    }
  }, [currentUrlProp])

  useEffect(() => {
    if (!currentUrlProp && settings?.homepage) {
      setInputValue(settings.homepage)
    }
  }, [currentUrlProp, settings?.homepage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const engine = settings?.searchEngine ?? 'google'
    onNavigate?.(formatOmniboxInput(inputValue.trim(), engine))
  }

  // URLBar만 렌더 (입력창)
  return (
    <form onSubmit={handleSubmit} className={cn('drag-region', wrapperClassName)}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="주소 입력..."
        className={cn(
          'w-full px-3 py-0.5 bg-transparent text-sm focus:outline-none transition-colors placeholder:text-(--color-text-muted)',
          'no-drag', // Allow text selection/input, prevent dragging
          inputClassName,
        )}
        style={{ height: '32px' }}
      />
    </form>
  )
}
