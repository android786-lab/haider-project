import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { showSuccess } from '../lib/toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Label from '../components/ui/Label'
import LoadingSpinner from '../components/shared/LoadingSpinner'

const STAFF_ROLES = ['patient', 'doctor', 'assistant']

const Login = () => {
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
        if (!STAFF_ROLES.includes(role)) {
          setError('Admin accounts must sign in from the Admin Portal.')
          return
        }
        setAuthToken(data.token, data.user)
        showSuccess('Welcome back!')
        navigate(getRedirectPath(role), { replace: true })
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Staff & Patient Login"
      subtitle="Sign in as Patient, Doctor, or Assistant"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
        )}
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            placeholder="••••••••"
          />
        </div>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading && <LoadingSpinner size="sm" />}
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
        <p className="text-center text-sm text-slate-500">
          New patient?{' '}
          <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">Register here</Link>
        </p>
        <p className="text-center text-sm text-slate-500 pt-2 border-t border-surface-border">
          Admin or Super Admin?{' '}
          <Link to="/admin/login" className="text-primary-600 font-semibold hover:text-primary-700">Admin Portal Login</Link>
        </p>
        <p className="text-xs text-center text-slate-400">
          Doctors and assistants are added by admin — contact your administrator for credentials.
        </p>
      </form>
    </AuthLayout>
  )
}

export default Login
