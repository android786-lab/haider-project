import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from './shared/PageLoader'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user, loading } = useAuth()

  if (loading) return <PageLoader message="Checking authentication..." />

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role === 'super_admin' ? 'superadmin' : user.role
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
