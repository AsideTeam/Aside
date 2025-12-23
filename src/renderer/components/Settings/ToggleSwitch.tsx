/**
 * ToggleSwitch - 토글 스위치 컨트롤
 *
 * 책임: 토글 상태 렌더링 + 클릭 처리
 * 특징: 순수 UI 컴포넌트, 상태는 부모가 관리
 */

import { useState } from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: ToggleSwitchProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked)
    }
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      style={{
        width: '48px',
        height: '26px',
        borderRadius: '13px',
        border: 'none',
        background: checked 
          ? 'var(--accent, #2563eb)' 
          : 'var(--bg-input)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background-color 0.3s ease, box-shadow 0.2s ease',
        opacity: disabled ? 0.5 : 1,
        boxShadow: isHovered && !disabled
          ? `0 0 0 2px rgba(var(--accent-rgb, 37, 99, 235), 0.1)`
          : 'none',
      }}
      aria-label="Toggle"
    >
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '24px' : '2px',
          width: '22px',
          height: '22px',
          borderRadius: '11px',
          background: 'white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          transition: 'left 0.3s ease',
        }}
      />
    </button>
  )
}
