/**
 * Toggle Switch Component
 * SRP: 토글 스위치 UI만 담당
 */

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function ToggleSwitch({ checked, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative w-9 h-3.5 rounded-full transition-all
        ${checked ? 'bg-[#1a73e8]' : 'bg-[#dadce0]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div
        className={`
          absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-md transition-all
          ${checked ? 'left-[calc(100%-22px)] bg-[#1a73e8]' : 'left-0.5 bg-white'}
        `}
        style={{
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  )
}
