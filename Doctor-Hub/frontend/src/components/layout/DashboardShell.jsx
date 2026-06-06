import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X, LogOut, Stethoscope } from 'lucide-react'
import { cn } from '../../lib/utils'
import Button from '../ui/Button'

const DashboardShell = ({ title, subtitle, navItems, footer, children }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-surface-muted">
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-surface-border flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="px-6 py-5 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-600 text-white">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {footer && <div className="px-4 py-4 border-t border-surface-border">{footer}</div>}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-surface-border px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">{title}</p>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

export const LogoutButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
  >
    <LogOut className="w-4 h-4" />
    Sign Out
  </button>
)

export default DashboardShell
