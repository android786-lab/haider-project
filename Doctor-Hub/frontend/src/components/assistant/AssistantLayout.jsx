import { Outlet } from 'react-router-dom'
import { LayoutDashboard, CreditCard, Calendar, BookOpen } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import DashboardShell, { LogoutButton } from '../layout/DashboardShell'

const NAV_ITEMS = [
  { to: '/assistant/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/assistant/pending-payments', label: 'Pending Payments', icon: CreditCard },
  { to: '/assistant/appointments', label: 'Appointments', icon: Calendar },
  { to: '/assistant/bookings', label: 'Bookings', icon: BookOpen },
]

const AssistantLayout = () => {
  const { user, logout } = useAuth()

  return (
    <DashboardShell
      title="Doctor Hub"
      subtitle="Assistant Portal"
      navItems={NAV_ITEMS}
      footer={
        <div>
          <div className="px-3 mb-2">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <LogoutButton onClick={logout} />
        </div>
      }
    >
      <Outlet />
    </DashboardShell>
  )
}

export default AssistantLayout
