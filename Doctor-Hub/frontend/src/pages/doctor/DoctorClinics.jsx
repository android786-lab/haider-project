import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import EmptyState from '../../components/shared/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Label from '../../components/ui/Label'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DoctorClinics = () => {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    clinicName: '',
    address: '',
    city: '',
    availableDays: [],
    startTime: '09:00',
    endTime: '17:00',
  })

  const fetchClinics = () => {
    api.get('/api/doctor/clinics')
      .then(({ data }) => { if (data.success) setClinics(data.clinics) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchClinics() }, [])

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const { data } = await api.post('/api/doctor/clinic', form)
      if (data.success) {
        setMessage('Clinic added successfully.')
        setForm({ clinicName: '', address: '', city: '', availableDays: [], startTime: '09:00', endTime: '17:00' })
        fetchClinics()
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add clinic.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Clinics"
        description="Manage your clinic locations and availability"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Clinic</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl">{message}</div>}
              {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

              <div>
                <Label>Clinic Name *</Label>
                <Input value={form.clinicName} onChange={(e) => setForm({ ...form, clinicName: e.target.value })} required />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>

              <div>
                <Label>Available Days</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {DAYS.map((day) => (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        form.availableDays.includes(day)
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-slate-600 border-surface-border hover:border-primary-500'
                      }`}>
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add Clinic'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="font-semibold text-slate-900">Your Clinics</h2>
          {loading ? (
            <div className="h-32 bg-white rounded-2xl animate-pulse" />
          ) : clinics.length === 0 ? (
            <Card>
              <EmptyState
                icon={MapPin}
                title="No clinics yet"
                description="Add your first clinic using the form."
              />
            </Card>
          ) : (
            clinics.map((clinic) => (
              <Card key={clinic.id}>
                <CardContent className="pt-5">
                  <h3 className="font-semibold text-slate-900">{clinic.clinicName}</h3>
                  <p className="text-sm text-slate-500 mt-1">{clinic.address}{clinic.city ? `, ${clinic.city}` : ''}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {clinic.startTime} – {clinic.endTime}
                  </p>
                  {clinic.availableDays?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {clinic.availableDays.map((d) => (
                        <span key={d} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{d}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DoctorClinics
