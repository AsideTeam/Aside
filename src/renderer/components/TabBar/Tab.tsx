import { X } from 'lucide-react'
import { useState } from 'react'

interface TabProps {
  id: string
  title: string
  active: boolean
  onClose: () => void
  onClick: () => void
}

export function Tab({ title, active, onClose, onClick }: TabProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        height: 'var(--height-tab-item)',
        padding: '0 16px',
        borderRadius: '8px 8px 0 0',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        minWidth: '120px',
        maxWidth: '240px',
        background: active ? 'var(--bg-toolbar)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        ...(isHovered && !active && {
          background: 'rgba(53, 54, 58, 0.3)'
        })
      }}
    >
      <span style={{
        fontSize: 'var(--font-sm)',
        fontWeight: '500',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {title}
      </span>
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        style={{
          marginLeft: '8px',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'all var(--transition-fast)',
          opacity: active || isHovered ? 1 : 0,
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--text-disabled)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
