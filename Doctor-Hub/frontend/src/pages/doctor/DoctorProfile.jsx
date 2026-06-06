import { useEffect, useState } from 'react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Label from '../../components/ui/Label'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'

const TREATMENT_TYPES = ['allopathic', 'homeopathic', 'herbal']

const DoctorProfile = () => {
  const [form, setForm] = useState({
    specialization: '',
    treatmentType: 'allopathic',
    experience: '',
    fee: '',
    bio: '',
  })
  const [isNew, setIsNew] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/doctor/profile')
      .then(({ data }) => {
        if (data.success && data.profile.specialization) {
          setIsNew(false)
          setForm({
            specialization: data.profile.specialization || '',
            treatmentType: data.profile.treatmentType || 'allopathic',
            experience: data.profile.experience ?? '',
            fee: data.profile.fee ?? '',
            bio: data.profile.bio || '',
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const method = isNew ? 'post' : 'put'
      const { data } = await api[method]('/api/doctor/profile', {
        ...form,
        experience: Number(form.experience) || 0,
        fee: Number(form.fee) || 0,
      })
      if (data.success) {
        setMessage(data.message)
        setIsNew(false)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="page-container animate-pulse"><div className="h-96 bg-white rounded-2xl" /></div>
  }

  return (
    <div className="page-container">
      <PageHeader
        title="My Profile"
        description="Manage your professional information visible to patients"
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl">{message}</div>}
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <div>
              <Label>Specialization *</Label>
              <Input name="specialization" value={form.specialization} onChange={handleChange} required
                placeholder="e.g. Cardiologist" />
            </div>

            <div>
              <Label>Treatment Type *</Label>
              <Select name="treatmentType" value={form.treatmentType} onChange={handleChange} required className="capitalize">
                {TREATMENT_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Experience (years)</Label>
                <Input name="experience" type="number" min="0" value={form.experience} onChange={handleChange} />
              </div>
              <div>
                <Label>Consultation Fee ($)</Label>
                <Input name="fee" type="number" min="0" step="0.01" value={form.fee} onChange={handleChange} />
              </div>
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea name="bio" value={form.bio} onChange={handleChange} rows={4}
                placeholder="Tell patients about your background and expertise..." />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isNew ? 'Save Profile' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default DoctorProfile
