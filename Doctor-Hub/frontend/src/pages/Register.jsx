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

const Register = () => {
  const navigate = useNavigate()
  const { setAuthToken, getRedirectPath } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register', form, { skipToast: true })
      if (data.success) {
        setAuthToken(data.token, data.user)
        showSuccess('Patient account created!')
        navigate(getRedirectPath('patient'), { replace: true })
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Patient Registration" subtitle="Create your patient account to book appointments">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
        )}
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="John Doe" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} placeholder="Min. 8 characters" />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading && <LoadingSpinner size="sm" />}
          {loading ? 'Creating account...' : 'Register as Patient'}
        </Button>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
        </p>
        <p className="text-xs text-center text-slate-400">
          Doctors and assistants cannot self-register. Your administrator will provide login credentials.
        </p>
      </form>
    </AuthLayout>
  )
}

export default Register
