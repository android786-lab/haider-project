import { Link } from 'react-router-dom'
import { Home, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'

const NotFound = () => {
  const { user, getRedirectPath } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-muted">
      <div className="text-center max-w-md">
        <p className="text-8xl font-extrabold text-primary-100">404</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-4">Page not found</h2>
        <p className="text-slate-500 mt-2">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
        <div className="flex gap-3 justify-center mt-8">
          <Link to="/"><Button variant="secondary"><Home className="w-4 h-4" /> Home</Button></Link>
          {user && (
            <Link to={getRedirectPath(user.role)}>
              <Button><LayoutDashboard className="w-4 h-4" /> Dashboard</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotFound
