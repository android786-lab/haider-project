import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { showSuccess } from '../lib/toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Label from '../components/ui/Label'
import Select from '../components/ui/Select'
import LoadingSpinner from '../components/shared/LoadingSpinner'

const ROLES = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'assistant', label: 'Assistant' },
]

const Register = () => {
  const navigate = useNavigate()
  const { setAuthToken, getRedirectPath } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient', doctorId: '' })
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
      const { data } = await api.post('/api/auth/register', form, { skipToast: true })
      if (data.success) {
        setAuthToken(data.token)
        showSuccess('Account created successfully!')
        navigate(getRedirectPath(data.user?.role || form.role))
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
    <AuthLayout title="Create account" subtitle="Join Doctor Hub — choose your role">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
        )}
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} placeholder="Min. 8 characters" />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" value={form.role} onChange={handleChange}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
        </div>
        {form.role === 'assistant' && (
          <div>
            <Label htmlFor="doctorId">Doctor UUID</Label>
            <Input id="doctorId" name="doctorId" value={form.doctorId} onChange={handleChange} required placeholder="Doctor's user ID (UUID)" />
            <p className="text-xs text-slate-400 mt-1.5">Ask your doctor for their account ID.</p>
          </div>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading && <LoadingSpinner size="sm" />}
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default Register
