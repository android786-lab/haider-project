import { cn } from '../../lib/utils'

const Label = ({ className, children, ...props }) => (
  <label className={cn('block text-sm font-medium text-slate-700 mb-1.5', className)} {...props}>
    {children}
  </label>
)

export default Label
