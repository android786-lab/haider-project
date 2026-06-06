import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../../lib/api'
import { showSuccess } from '../../lib/toast'
import PageLoader from '../../components/shared/PageLoader'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import PageHeader from '../../components/shared/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Label from '../../components/ui/Label'
import Textarea from '../../components/ui/Textarea'

const DoctorAddMedicalRecord = () => {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  const [form, setForm] = useState({ symptoms: '', diagnosis: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/api/doctor/appointments/${appointmentId}`)
      .then(({ data }) => {
        if (data.success) {
          if (!['confirmed', 'completed'].includes(data.appointment.status)) {
            setError('Only confirmed or completed appointments can have medical records.')
          }
          setAppointment(data.appointment)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [appointmentId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { data } = await api.post('/api/doctor/medical-history', {
        patientId: appointment.patientId,
        appointmentId: parseInt(appointmentId, 10),
        ...form,
      })
      if (data.success) {
        showSuccess('Medical record saved successfully.')
        navigate(`/doctor/appointments/${appointmentId}/prescription?historyId=${data.medicalHistory.id}`)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medical record.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader message="Loading appointment..." />

  return (
    <div className="page-container">
      <Link to={`/doctor/appointments/${appointmentId}`} className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to appointment
      </Link>

      <PageHeader
        title="Add Medical Record"
        description={appointment ? `Patient: ${appointment.patientName} — ${appointment.date} at ${appointment.timeSlot}` : undefined}
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <div>
              <Label>Symptoms</Label>
              <Input name="symptoms" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                placeholder="e.g. Fever, headache, fatigue" />
            </div>

            <div>
              <Label>Diagnosis *</Label>
              <Input name="diagnosis" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                required
                placeholder="e.g. Viral fever" />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea name="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={4}
                placeholder="Additional clinical notes..." />
            </div>

            <p className="text-xs text-slate-500">Medical history records cannot be deleted once saved.</p>

            <Button type="submit" disabled={saving || !!error}>
              {saving && <LoadingSpinner size="sm" />}
              {saving ? 'Saving...' : 'Save Medical Record'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default DoctorAddMedicalRecord
