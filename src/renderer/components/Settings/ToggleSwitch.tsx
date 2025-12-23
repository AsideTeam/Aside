/**
 * ToggleSwitch - 토글 스위치 컨트롤
 *
 * 책임: 토글 상태 렌더링 + 클릭 처리
 * 특징: 순수 UI 컴포넌트, 상태는 부모가 관리
 */

import React from 'react'

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
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        border: 'none',
        background: checked ? 'var(--color-primary)' : 'var(--bg-input)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background-color 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}
      aria-label="Toggle"
    >
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          width: '20px',
          height: '20px',
          borderRadius: '10px',
          background: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}
