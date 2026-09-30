import type { ReactNode } from 'react'

type ToolButtonProps = {
  title: string
  onClick: () => void
  children: ReactNode
  active?: boolean
  disabled?: boolean
  size?: 'regular' | 'small'
}

/** Square icon button used by every toolbar. `title` doubles as the accessible label. */
export function ToolButton({ title, onClick, children, active, disabled, size = 'regular' }: ToolButtonProps) {
  const classes = ['tool-btn', size === 'small' && 'small', active && 'active'].filter(Boolean).join(' ')
  return (
    <button className={classes} title={title} aria-label={title} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
