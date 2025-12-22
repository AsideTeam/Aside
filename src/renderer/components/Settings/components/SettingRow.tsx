/**
 * Setting Row Component
 * SRP: 설정 항목 하나의 레이아웃만 담당
 */

interface SettingRowProps {
  label: string
  description?: string
  children?: React.ReactNode
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[#dadce0] min-h-[60px]">
      <div className="flex-1 pr-4">
        <div className="text-sm text-[#202124] font-normal">{label}</div>
        {description && (
          <div className="text-xs text-[#5f6368] mt-1 leading-relaxed">{description}</div>
        )}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  )
}
