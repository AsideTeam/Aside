interface NavButtonProps {
  icon: React.ReactNode
  title: string
  disabled?: boolean
  onClick?: () => void
}

export function NavButton({ icon, title, disabled, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="icon-button"
    >
      {icon}
    </button>
  )
}
