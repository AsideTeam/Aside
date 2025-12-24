import React, { useEffect, useState } from 'react'
import { cn } from '@renderer/styles'
import { formatUrl } from '@renderer/lib/utils'

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
  const [inputValue, setInputValue] = useState(currentUrlProp ?? 'https://www.google.com')

  useEffect(() => {
    if (currentUrlProp) {
      setInputValue(currentUrlProp)
    }
  }, [currentUrlProp])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNavigate?.(formatUrl(inputValue.trim()))
  }

  // URLBar만 렌더 (입력창)
  return (
    <form onSubmit={handleSubmit} className={cn(wrapperClassName)}>
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
  )
}
