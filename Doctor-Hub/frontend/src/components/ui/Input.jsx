import { cn } from '../../lib/utils'

const Input = ({ className, ...props }) => (
  <input
    className={cn(
      'flex h-10 w-full rounded-xl border border-surface-border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
)

export default Input
