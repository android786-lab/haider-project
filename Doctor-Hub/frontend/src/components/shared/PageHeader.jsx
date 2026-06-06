import { cn } from '../../lib/utils'

const PageHeader = ({ title, description, action, className }) => (
  <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8', className)}>
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
      {description && <p className="text-slate-500 mt-1.5 text-sm sm:text-base">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
)

export default PageHeader
