import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Plus, X } from 'lucide-react'
import api from '../../lib/api'
import { showSuccess } from '../../lib/toast'
import PageLoader from '../../components/shared/PageLoader'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import PageHeader from '../../components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Label from '../../components/ui/Label'
import Textarea from '../../components/ui/Textarea'

const EMPTY_MEDICINE = { name: '', dosage: '', frequency: '', duration: '' }

const DoctorAddPrescription = () => {
  const { appointmentId } = useParams()
  const [searchParams] = useSearchParams()
  const historyId = searchParams.get('historyId')
  const navigate = useNavigate()

  const [appointment, setAppointment] = useState(null)
  const [medicines, setMedicines] = useState([{ ...EMPTY_MEDICINE }])
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!historyId) {
      setError('Medical history ID is required.')
      setLoading(false)
      return
    }
    api.get(`/api/doctor/appointments/${appointmentId}`)
      .then(({ data }) => {
        if (data.success) {
          const raw = data.appointment || data.data
          setAppointment({
            ...raw,
            patientId: raw.patientId || raw.patient_id,
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [appointmentId, historyId])

  const updateMedicine = (index, field, value) => {
    setMedicines((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  }

  const addMedicine = () => setMedicines((prev) => [...prev, { ...EMPTY_MEDICINE }])

  const removeMedicine = (index) => {
    if (medicines.length > 1) setMedicines((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validMeds = medicines.filter((m) => m.name.trim())
    if (!validMeds.length) {
      setError('At least one medicine with a name is required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const { data } = await api.post('/api/doctor/prescription', {
        patientId: appointment.patientId,
        appointmentId,
        medicalHistoryId: historyId,
        medicines: validMeds,
        instructions,
      })
      if (data.success) {
        showSuccess('Prescription submitted. It cannot be edited.')
        navigate(`/doctor/patients/${appointment.patientId}/history`)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create prescription.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader message="Loading..." />

  return (
    <div className="page-container">
      <Link to={`/doctor/appointments/${appointmentId}`} className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to appointment
      </Link>

      <PageHeader
        title="Add Prescription"
        description={appointment ? `Patient: ${appointment.patientName} — ${appointment.date}` : undefined}
      />

      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl mb-6 flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        Prescriptions cannot be edited after submission. Please review carefully before saving.
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <div>
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-base">Medicines</CardTitle>
                <Button type="button" variant="ghost" size="sm" onClick={addMedicine}>
                  <Plus className="w-4 h-4" /> Add Medicine
                </Button>
              </div>

              <div className="space-y-4">
                {medicines.map((med, index) => (
                  <div key={index} className="border border-surface-border rounded-xl p-4 relative">
                    {medicines.length > 1 && (
                      <button type="button" onClick={() => removeMedicine(index)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <p className="text-xs font-medium text-slate-500 mb-2">Medicine {index + 1}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Name *" value={med.name}
                        onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                        className="col-span-2" />
                      <Input placeholder="Dosage (e.g. 500mg)" value={med.dosage}
                        onChange={(e) => updateMedicine(index, 'dosage', e.target.value)} />
                      <Input placeholder="Frequency (e.g. twice daily)" value={med.frequency}
                        onChange={(e) => updateMedicine(index, 'frequency', e.target.value)} />
                      <Input placeholder="Duration (e.g. 7 days)" value={med.duration}
                        onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                        className="col-span-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>General Instructions</Label>
              <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="e.g. Take after meals, avoid alcohol..." />
            </div>

            <Button type="submit" disabled={saving}>
              {saving && <LoadingSpinner size="sm" />}
              {saving ? 'Submitting...' : 'Submit Prescription (Final)'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default DoctorAddPrescription
