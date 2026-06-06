import { cn } from '../../lib/utils'

const Textarea = ({ className, ...props }) => (
  <textarea
    className={cn(
      'flex min-h-[100px] w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400',
      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
      className
    )}
    {...props}
  />
)

export default Textarea
