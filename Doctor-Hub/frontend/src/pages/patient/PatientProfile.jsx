import { useEffect, useState } from 'react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Label from '../../components/ui/Label'
import Textarea from '../../components/ui/Textarea'

const PatientProfile = () => {
  const [form, setForm] = useState({ age: '', bloodGroup: '', medicalNotes: '' })
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/api/patient/profile')
      .then(({ data }) => {
        if (data.success) {
          setForm({
            age: data.profile.age ?? '',
            bloodGroup: data.profile.bloodGroup ?? '',
            medicalNotes: data.profile.medicalNotes ?? '',
          })
          setName(data.profile.name)
          setEmail(data.profile.email)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const { data } = await api.put('/api/patient/profile', {
        ...form,
        age: form.age ? Number(form.age) : null,
      })
      if (data.success) setMessage('Profile updated successfully.')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-container"><div className="h-80 bg-white rounded-2xl animate-pulse" /></div>

  return (
    <div className="page-container">
      <PageHeader
        title="Profile"
        description="Manage your personal and medical information"
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div className={`text-sm px-4 py-3 rounded-xl ${message.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={name} disabled className="bg-slate-50 text-slate-500" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={email} disabled className="bg-slate-50 text-slate-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Age</Label>
                <Input type="number" min="0" value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </div>
              <div>
                <Label>Blood Group</Label>
                <Input value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  placeholder="e.g. O+" />
              </div>
            </div>

            <div>
              <Label>Medical Notes</Label>
              <Textarea value={form.medicalNotes} rows={3}
                onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })}
                placeholder="Allergies, chronic conditions, etc." />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default PatientProfile
