export function Button({ children, variant = 'primary', onClick, disabled }: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  onClick?: () => void
  disabled?: boolean
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded px-4 py-2 font-medium transition-colores duration-150'

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-background text-foreground hover:bg-border',
    ghost: 'hover:bg-primary/10 text-primary hover:text-primary',
  }

  return (
    <button
      className={baseClasses + ' ' + (variantClasses[variant] || variantClasses.primary)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}