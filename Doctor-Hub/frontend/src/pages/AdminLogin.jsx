import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { showSuccess } from '../lib/toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Label from '../components/ui/Label'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { Card, CardContent } from '../components/ui/Card'

const ADMIN_ROLES = ['admin', 'superadmin']

const AdminLogin = () => {
  const navigate = useNavigate()
  const { setAuthToken, getRedirectPath } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', form, { skipToast: true })
      if (data.success) {
        const role = data.user?.role
        if (!ADMIN_ROLES.includes(role)) {
          setError('This portal is for Admin and Super Admin only. Use Staff Login for other roles.')
          return
        }
        setAuthToken(data.token, data.user)
        showSuccess('Welcome, Admin!')
        navigate(getRedirectPath(role), { replace: true })
      } else {
        setError(data.message)
      }
    } catch (err) {
      const msg = err.response?.data?.message
      if (err.response?.data?.code === 'PENDING_APPROVAL') {
        setError(msg || 'Your admin account is not approved yet. Please wait for Super Admin approval.')
      } else {
        setError(msg || 'Login failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <Card className="w-full max-w-md shadow-elevated border-slate-700">
        <CardContent className="pt-8 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-slate-800 text-primary-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
              <p className="text-sm text-slate-500">Admin & Super Admin only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
            )}
            <div>
              <Label htmlFor="email">Admin email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <LoadingSpinner size="sm" />}
              {loading ? 'Signing in...' : 'Sign In to Admin Portal'}
            </Button>
            <p className="text-center text-sm text-slate-500">
              Patient, Doctor, or Assistant?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Staff Login</Link>
            </p>
            <p className="text-center text-sm text-slate-500">
              Need admin access?{' '}
              <Link to="/admin/register" className="text-primary-600 font-semibold hover:text-primary-700">Register as Admin</Link>
            </p>
            <p className="text-center text-sm text-slate-400">
              <Link to="/" className="hover:text-primary-600">← Back to home</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminLogin
