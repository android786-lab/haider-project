import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from './shared/PageLoader'

const ProtectedRoute = ({ children, allowedRoles, loginPath = '/login' }) => {
  const { token, user, loading } = useAuth()

  if (!token) {
    return <Navigate to={loginPath} replace />
  }

  if (loading || !user) {
    return <PageLoader message="Checking authentication..." />
  }

  const role = user.role === 'super_admin' ? 'superadmin' : user.role
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
