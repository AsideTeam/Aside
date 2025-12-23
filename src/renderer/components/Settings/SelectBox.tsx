/**
 * SelectBox - 선택 드롭다운
 *
 * 책임: 드롭다운 렌더링 + 선택 처리
 * 특징: 기본 HTML select를 스타일링한 컴포넌트
 */

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectBoxProps {
  value: string | number
  onChange?: (value: string | number) => void
  options: Array<{ value: string | number; label: string }>
  disabled?: boolean
}

export function SelectBox({
  value,
  onChange,
  options,
  disabled = false,
}: SelectBoxProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div style={{ position: 'relative', width: '160px' }}>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        style={{
          width: '100%',
          height: '32px',
          padding: '0 12px',
          paddingRight: '32px',
          background: 'var(--bg-input)',
          border: isFocused 
            ? '1px solid var(--accent)' 
            : '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-sm)',
          color: 'var(--text-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          appearance: 'none',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow: isFocused 
            ? '0 0 0 2px rgba(var(--accent-rgb), 0.1)' 
            : 'none',
          fontWeight: '500',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: 'var(--text-secondary)',
        }}
      />
    </div>
  )
}
