import { Link } from 'react-router-dom'
import { ShieldX, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'

const Unauthorized = () => {
  const { user, getRedirectPath, logout } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-muted">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <p className="text-6xl font-extrabold text-slate-200 mt-6">403</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-2">Access denied</h2>
        <p className="text-slate-500 mt-2">
          You don&apos;t have permission to view this page.
          {user && (
            <span className="block mt-1 text-sm">
              Signed in as <span className="font-semibold capitalize">{user.role}</span>
            </span>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link to={user ? getRedirectPath(user.role) : '/'}>
            <Button><LayoutDashboard className="w-4 h-4" /> {user ? 'Dashboard' : 'Home'}</Button>
          </Link>
          <Button variant="secondary" onClick={logout}><LogOut className="w-4 h-4" /> Switch Account</Button>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized
