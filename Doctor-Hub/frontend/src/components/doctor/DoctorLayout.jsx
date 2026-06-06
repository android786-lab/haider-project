import { Outlet } from 'react-router-dom'
import { LayoutDashboard, User, Building2, Calendar, ClipboardList, Users, Pill } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import DashboardShell, { LogoutButton } from '../layout/DashboardShell'

const NAV_ITEMS = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/doctor/profile', label: 'My Profile', icon: User },
  { to: '/doctor/clinics', label: 'Clinics', icon: Building2 },
  { to: '/doctor/schedule', label: 'Schedule', icon: Calendar },
  { to: '/doctor/appointments', label: 'Appointments', icon: ClipboardList },
  { to: '/doctor/patients', label: 'Patients', icon: Users },
  { to: '/doctor/prescriptions', label: 'Prescriptions', icon: Pill },
]

const DoctorLayout = () => {
  const { user, logout } = useAuth()

  return (
    <DashboardShell
      title="Doctor Hub"
      subtitle="Doctor Portal"
      navItems={NAV_ITEMS}
      footer={
        <div>
          <div className="px-3 mb-2">
            <p className="text-sm font-semibold text-slate-800 truncate">Dr. {user?.name}</p>
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

export default DoctorLayout
