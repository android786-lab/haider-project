import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, CheckCircle } from 'lucide-react'
import api from '../lib/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Label from '../components/ui/Label'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { Card, CardContent } from '../components/ui/Card'

const AdminRegister = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register-admin', form, { skipToast: true })
      if (data.success) {
        setSuccess(
          data.message ||
            'Your registration has been sent to the Super Admin for approval. You will be notified once approved.'
        )
        setForm({ name: '', email: '', password: '', phone: '' })
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <Card className="w-full max-w-md shadow-elevated">
        <CardContent className="pt-8 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-slate-100 text-primary-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Registration</h1>
              <p className="text-sm text-slate-500">Requires Super Admin approval</p>
            </div>
          </div>

          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-slate-700 text-sm leading-relaxed">{success}</p>
              <Link to="/admin/login" className="inline-block mt-6">
                <Button variant="outline">Back to Admin Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
              )}
              <div>
                <Label>Full name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Password *</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
              </div>
              <p className="text-xs text-slate-400">
                After you submit, the Super Admin will receive a notification. You cannot sign in until approved.
              </p>
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <LoadingSpinner size="sm" />}
                {loading ? 'Submitting...' : 'Request Admin Access'}
              </Button>
              <p className="text-center text-sm text-slate-500">
                Already approved? <Link to="/admin/login" className="text-primary-600 font-semibold">Admin Login</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminRegister
