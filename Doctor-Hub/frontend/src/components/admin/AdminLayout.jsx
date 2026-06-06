import { Outlet } from 'react-router-dom'
import { LayoutDashboard, Stethoscope, Users, Calendar, CreditCard, Shield, UserCog } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import DashboardShell, { LogoutButton } from '../layout/DashboardShell'

const BASE_NAV = [
  { to: '/admin/dashboard', label: 'Analytics', icon: LayoutDashboard, end: true },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/patients', label: 'Patients', icon: Users },
  { to: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
]

const SUPER_NAV = [
  { to: '/admin/admins', label: 'Admins', icon: Shield },
  { to: '/admin/users', label: 'All Users', icon: UserCog },
]

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'super_admin'
  const navItems = isSuperAdmin ? [...BASE_NAV, ...SUPER_NAV] : BASE_NAV

  return (
    <DashboardShell
      title="Doctor Hub"
      subtitle={isSuperAdmin ? 'Super Admin' : 'Admin Portal'}
      navItems={navItems}
      footer={
        <div>
          <div className="px-3 mb-2">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
          <LogoutButton onClick={logout} />
        </div>
      }
    >
      <Outlet />
    </DashboardShell>
  )
}

export default AdminLayout
