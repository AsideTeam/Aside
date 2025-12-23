/**
 * SegmentControl - 세그먼트 버튼 그룹
 */

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
  return (
    <div className="segment-control" style={{ opacity: disabled ? 0.5 : 1 }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => !disabled && onChange?.(option.value)}
          disabled={disabled}
          className={`segment-control-item ${value === option.value ? 'active' : ''}`}
        >
          {option.icon && <span className="segment-control-item-icon">{option.icon}</span>}
          {option.label}
        </button>
      ))}
    </div>
  )
}

