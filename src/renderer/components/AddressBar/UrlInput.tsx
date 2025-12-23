import { Lock, Star } from 'lucide-react'
import { useState } from 'react'

interface UrlInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function UrlInput({ value, onChange, onSubmit }: UrlInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit()
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '700px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      height: 'var(--height-url-input)',
      padding: '0 16px',
      background: isFocused ? 'var(--bg-input-hover)' : 'var(--bg-input)',
      borderRadius: 'var(--radius-full)',
      transition: 'all var(--transition-fast)'
    }}>
      <Lock size={16} style={{ 
        color: 'var(--icon-default)', 
        flexShrink: 0 
      }} />
      
      <input
        type="text"
        placeholder="Google에서 검색하거나 URL을 입력하세요."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          flex: 1,
          background: 'transparent',
          fontSize: 'var(--font-md)',
          color: 'var(--text-primary)',
          minWidth: 0
        }}
      />
      
      <button
        style={{
          flexShrink: 0,
          color: 'var(--icon-default)',
          transition: 'color var(--transition-fast)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--icon-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--icon-default)'
        }}
        title="북마크 추가"
      >
        <Star size={18} />
      </button>
    </div>
  )
}
