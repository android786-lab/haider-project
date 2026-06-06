import { cn } from '../../lib/utils'

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-surface-border hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border-2 border-primary-600 text-primary-700 hover:bg-primary-50',
}

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    disabled={disabled}
    className={cn(
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
      variants[variant],
      sizes[size],
      className
    )}
    {...props}
  >
    {children}
  </button>
)

export default Button
