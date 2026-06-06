import { Outlet } from 'react-router-dom'
import { LayoutDashboard, Search, Calendar, FileText, Pill, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import DashboardShell, { LogoutButton } from '../layout/DashboardShell'

const NAV_ITEMS = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/patient/doctors', label: 'Find Doctor', icon: Search },
  { to: '/patient/appointments', label: 'Appointments', icon: Calendar },
  { to: '/patient/history', label: 'Medical History', icon: FileText },
  { to: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
  { to: '/patient/profile', label: 'Profile', icon: User },
]

const PatientLayout = () => {
  const { user, logout } = useAuth()

  return (
    <DashboardShell
      title="Doctor Hub"
      subtitle="Patient Portal"
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

export default PatientLayout
