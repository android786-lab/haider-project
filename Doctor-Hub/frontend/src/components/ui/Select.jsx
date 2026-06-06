import { cn } from '../../lib/utils'

const Select = ({ className, children, ...props }) => (
  <select
    className={cn(
      'flex h-10 w-full rounded-xl border border-surface-border bg-white px-3.5 py-2 text-sm text-slate-900',
      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
      className
    )}
    {...props}
  >
    {children}
  </select>
)

export default Select
