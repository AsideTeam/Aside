/**
 * SelectBox - 드롭다운 선택
 */

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
  return (
    <div className="select-box">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="select-box-input"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="select-box-icon" />
    </div>
  )
}

