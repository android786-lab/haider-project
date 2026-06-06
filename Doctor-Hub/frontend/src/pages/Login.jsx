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

const Login = () => {
  const navigate = useNavigate()
  const { setAuthToken, getRedirectPath } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', form, { skipToast: true })
      if (data.success) {
        setAuthToken(data.token)
        showSuccess('Welcome back!')
        const role = data.user?.role || 'patient'
        navigate(getRedirectPath(role))
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
    <AuthLayout title="Welcome back" subtitle="Sign in to your Doctor Hub account">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required placeholder="••••••••" />
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
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">Create one</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default Login
