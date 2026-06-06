import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Label from '../components/ui/Label'

const API_URL = import.meta.env.VITE_API_URL || ''

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setResetToken('')
    setLoading(true)
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/forgot-password`, { email })
      if (data.success) {
        setMessage(data.message)
        if (data.reset_token) setResetToken(data.reset_token)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Reset password" subtitle="We'll send you a reset token (demo mode)">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
        {message && (
          <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl border border-emerald-100">
            {message}
            {resetToken && (
              <p className="mt-2 text-xs break-all font-mono bg-white/60 p-2 rounded-lg">
                Token: {resetToken}
              </p>
            )}
          </div>
        )}
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Sending...' : 'Send Reset Token'}
        </Button>
        <p className="text-center text-sm text-slate-500">
          <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Back to Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default ForgotPassword
