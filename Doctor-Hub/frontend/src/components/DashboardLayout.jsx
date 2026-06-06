import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DashboardLayout = ({ title, children }) => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-primary">
            Doctor Hub
          </Link>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600 font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.name} <span className="text-primary capitalize">({user?.role})</span>
          </span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  )
}

export default DashboardLayout
