import { useState } from 'react'
import { AlertTriangle, Plus, X } from 'lucide-react'
import api from '../../lib/api'
import { showSuccess } from '../../lib/toast'
import LoadingSpinner from '../shared/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Label from '../ui/Label'
import Textarea from '../ui/Textarea'

const EMPTY_MEDICINE = { name: '', dosage: '', frequency: '', duration: '' }

const PrescriptionFormCard = ({
  patientId,
  patientName,
  appointmentId,
  medicalHistoryId,
  onSuccess,
  onCancel,
}) => {
  const [medicines, setMedicines] = useState([{ ...EMPTY_MEDICINE }])
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      const payload = {
        patientId,
        medicines: validMeds,
        instructions,
      }
      if (appointmentId) payload.appointmentId = appointmentId
      if (medicalHistoryId) payload.medicalHistoryId = medicalHistoryId

      const { data } = await api.post('/api/doctor/prescription', payload)
      if (data.success) {
        showSuccess('Prescription saved successfully.')
        setMedicines([{ ...EMPTY_MEDICINE }])
        setInstructions('')
        onSuccess?.()
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create prescription.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-primary-200 bg-primary-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          New Prescription
          {patientName && <span className="text-sm font-normal text-slate-500">for {patientName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          Prescriptions cannot be edited after submission. Review carefully before saving.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="mb-0">Medicines</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addMedicine}>
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
            <div className="space-y-3">
              {medicines.map((med, index) => (
                <div key={index} className="bg-white border border-surface-border rounded-xl p-4 relative">
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicine(index)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <p className="text-xs font-medium text-slate-500 mb-2">Medicine {index + 1}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Name *"
                      value={med.name}
                      onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                      className="col-span-2"
                    />
                    <Input
                      placeholder="Dosage (e.g. 500mg)"
                      value={med.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                    />
                    <Input
                      placeholder="Frequency (e.g. twice daily)"
                      value={med.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                    />
                    <Input
                      placeholder="Duration (e.g. 7 days)"
                      value={med.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      className="col-span-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>General Instructions</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="e.g. Take after meals, avoid alcohol..."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving}>
              {saving && <LoadingSpinner size="sm" />}
              {saving ? 'Saving...' : 'Save Prescription'}
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default PrescriptionFormCard
