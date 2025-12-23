/**
 * SettingsSearch - 검색 바
 *
 * 책임: 검색 입력 필드 렌더링
 * 특징: 순수 UI, 검색 로직은 부모에서 처리
 */

import { useState } from 'react'
import { Search } from 'lucide-react'

interface SettingsSearchProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export function SettingsSearch({
  value = '',
  onChange,
  placeholder = 'Search settings',
}: SettingsSearchProps) {
  const [isFocused, setIsFocused] = useState(false)
  return (
    <div
      style={{
        position: 'relative',
        marginBottom: '24px',
      }}
    >
      <Search
        size={18}
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-secondary)',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%',
          height: '40px',
          paddingLeft: '40px',
          paddingRight: '12px',
          background: 'var(--bg-input)',
          border: isFocused ? '1px solid var(--accent)' : '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--font-md)',
          color: 'var(--text-primary)',
          outline: 'none',
          transition: 'all 0.2s',
          boxShadow: isFocused ? '0 0 0 2px rgba(var(--accent-rgb, 37, 99, 235), 0.1)' : 'none',
        }}
      />
    </div>
  )
}
