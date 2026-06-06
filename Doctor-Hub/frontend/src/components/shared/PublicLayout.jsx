import { Link, Outlet } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'

const PublicLayout = () => {
  const { isAuthenticated, user, getRedirectPath } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-hero-gradient">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-primary-600 text-white group-hover:bg-primary-700 transition-colors">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900">Doctor Hub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link to="/about" className="hover:text-primary-600 transition-colors">About</Link>
            <Link to="/contact" className="hover:text-primary-600 transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <Link to={getRedirectPath(user.role)}>
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-surface-border bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Doctor Hub. Healthcare made simple.</p>
          <div className="flex gap-6">
            <Link to="/about" className="hover:text-primary-600">About</Link>
            <Link to="/contact" className="hover:text-primary-600">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
