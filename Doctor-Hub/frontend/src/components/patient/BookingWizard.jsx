import { useState } from 'react'
import api from '../../lib/api'

const STEPS = ['Select Clinic', 'Date & Time', 'Confirm', 'Payment']

const BookingWizard = ({ doctor, onClose, onComplete }) => {
  const [step, setStep] = useState(0)
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [appointment, setAppointment] = useState(null)
  const [screenshot, setScreenshot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const schedules = doctor.schedules?.filter((s) => s.availableSlots?.length > 0) || []

  const bookAppointment = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/appointments', {
        doctorId: doctor.id,
        clinicId: selectedClinic.id,
        date: selectedDate,
        timeSlot: selectedSlot,
      })
      if (data.success) {
        setAppointment(data.appointment)
        setStep(3)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed.')
    } finally {
      setLoading(false)
    }
  }

  const uploadPayment = async () => {
    if (!screenshot) {
      setError('Please select a payment screenshot.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('appointmentId', appointment.id)
      formData.append('amount', doctor.fee)
      formData.append('screenshot', screenshot)

      const { data } = await api.post('/api/payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (data.success) {
        onComplete?.()
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment upload failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Book Appointment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="px-6 py-3 flex gap-1">
          {STEPS.map((label, i) => (
            <div key={label} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="px-6 py-4">
          {error && <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Step 1: Select a clinic</p>
              {doctor.clinics?.length ? doctor.clinics.map((clinic) => (
                <button key={clinic.id} onClick={() => { setSelectedClinic(clinic); setStep(1) }}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedClinic?.id === clinic.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                  }`}>
                  <p className="font-medium">{clinic.clinicName}</p>
                  <p className="text-sm text-gray-500">{clinic.address}, {clinic.city}</p>
                  <p className="text-xs text-gray-400 mt-1">{clinic.startTime} – {clinic.endTime}</p>
                </button>
              )) : <p className="text-gray-500 text-sm">No clinics available.</p>}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Step 2: Select date and time</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {schedules.map((s) => (
                  <button key={s.date} onClick={() => setSelectedDate(s.date)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                      selectedDate === s.date ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}>
                    {s.date}
                  </button>
                ))}
              </div>
              {selectedDate && (
                <div className="flex flex-wrap gap-2">
                  {schedules.find((s) => s.date === selectedDate)?.availableSlots?.map((slot) => (
                    <button key={slot} onClick={() => setSelectedSlot(slot)}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${
                        selectedSlot === slot ? 'bg-primary text-white border-primary' : 'border-gray-300'
                      }`}>
                      {slot}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="px-4 py-2 border rounded-lg text-sm">Back</button>
                <button onClick={() => setStep(2)} disabled={!selectedSlot}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Step 3: Confirm booking</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p><span className="text-gray-500">Doctor:</span> Dr. {doctor.name}</p>
                <p><span className="text-gray-500">Clinic:</span> {selectedClinic?.clinicName}</p>
                <p><span className="text-gray-500">Date:</span> {selectedDate}</p>
                <p><span className="text-gray-500">Time:</span> {selectedSlot}</p>
                <p><span className="text-gray-500">Fee:</span> ${doctor.fee}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="px-4 py-2 border rounded-lg text-sm">Back</button>
                <button onClick={bookAppointment} disabled={loading}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Step 4: Upload payment screenshot</p>
              <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">
                Appointment booked! Please upload your payment proof.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Screenshot (${doctor.fee})
                </label>
                <input type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary" />
                {screenshot && <p className="text-xs text-gray-500 mt-1">{screenshot.name}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Skip for now</button>
                <button onClick={uploadPayment} disabled={loading}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50">
                  {loading ? 'Uploading...' : 'Submit Payment'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingWizard
