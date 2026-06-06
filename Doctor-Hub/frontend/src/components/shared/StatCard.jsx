import { cn } from '../../lib/utils'
import { Card, CardContent } from '../ui/Card'

const colorMap = {
  primary: 'bg-primary-50 text-primary-600',
  blue: 'bg-sky-50 text-sky-600',
  green: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-violet-50 text-violet-600',
}

const StatCard = ({ label, value, icon: Icon, color = 'primary', trend }) => (
  <Card className="hover:shadow-elevated transition-shadow duration-300">
    <CardContent className="pt-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {trend && <p className="text-xs text-slate-400">{trend}</p>}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-xl', colorMap[color])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)

export default StatCard
