/**
 * ToggleSwitch - 토글 스위치
 */

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
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange?.(!checked)}
      disabled={disabled}
      className={`toggle-switch ${checked ? 'active' : ''}`}
      aria-pressed={checked}
    >
      <span className="toggle-switch-knob" />
    </button>
  )
}
