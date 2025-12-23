/**
 * SegmentControl - 세그먼트 버튼 (라디오 버튼 그룹)
 *
 * 책임: 여러 옵션 중 하나 선택
 * 특징: 토글 스위치보다 직관적, 3개 이상 옵션에 적합
 */

import React, { useState } from 'react'

interface SegmentControlProps {
  value: string
  onChange?: (value: string) => void
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>
  disabled?: boolean
}

export function SegmentControl({
  value,
  onChange,
  options,
  disabled = false,
}: SegmentControlProps) {
  const [hoveredValue, setHoveredValue] = useState<string | null>(null)

  return (
    <div
      style={{
        display: 'flex',
        gap: '2px',
        padding: '4px',
        background: 'var(--bg-input)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => !disabled && onChange?.(option.value)}
          onMouseEnter={() => setHoveredValue(option.value)}
          onMouseLeave={() => setHoveredValue(null)}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: value === option.value 
              ? 'var(--accent, #2563eb)' 
              : hoveredValue === option.value
              ? 'rgba(0,0,0,0.04)'
              : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-sm)',
            fontWeight: '600',
            color:
              value === option.value
                ? 'white'
                : hoveredValue === option.value
                ? 'var(--text-primary)'
                : 'var(--text-secondary)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow:
              value === option.value 
                ? '0 2px 8px rgba(var(--accent-rgb, 37, 99, 235), 0.3)' 
                : 'none',
          }}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  )
}
