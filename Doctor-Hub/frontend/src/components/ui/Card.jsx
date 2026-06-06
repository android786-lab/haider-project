import { cn } from '../../lib/utils'

export const Card = ({ className, children, ...props }) => (
  <div className={cn('bg-white rounded-2xl border border-surface-border shadow-card', className)} {...props}>
    {children}
  </div>
)

export const CardHeader = ({ className, children }) => (
  <div className={cn('px-5 sm:px-6 pt-5 sm:pt-6 pb-4', className)}>{children}</div>
)

export const CardTitle = ({ className, children }) => (
  <h3 className={cn('text-lg font-semibold text-slate-900', className)}>{children}</h3>
)

export const CardDescription = ({ className, children }) => (
  <p className={cn('text-sm text-slate-500 mt-1', className)}>{children}</p>
)

export const CardContent = ({ className, children }) => (
  <div className={cn('px-5 sm:px-6 pb-5 sm:pb-6', className)}>{children}</div>
)

export const CardFooter = ({ className, children }) => (
  <div className={cn('px-5 sm:px-6 py-4 border-t border-surface-border bg-slate-50/50 rounded-b-2xl', className)}>
    {children}
  </div>
)
