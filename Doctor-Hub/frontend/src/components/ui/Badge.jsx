import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-slate-100 text-slate-700',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-sky-50 text-sky-700',
}

const Badge = ({ children, variant = 'default', className }) => (
  <span
    className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
      variants[variant],
      className
    )}
  >
    {children}
  </span>
)

export default Badge
