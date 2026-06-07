import { useState } from 'react'

import api from '../../lib/api'

import Button from '../ui/Button'

import { formatFeePKR } from '../../lib/doctorMappers'



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

  const feeLabel = doctor.feeLabel || formatFeePKR(doctor.fee)



  const bookAppointment = async () => {

    setLoading(true)

    setError('')

    try {

      const payload = {
        doctor_id: doctor.id,
        slot_date: selectedDate,
        slot_time: selectedSlot,
      }
      if (selectedClinic?.id) payload.clinic_id = selectedClinic.id

      const { data } = await api.post('/api/appointments', payload)

      if (data.success) {

        setAppointment(data.appointment || data.data)

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
      formData.append('appointment_id', appointment.id)
      formData.append('screenshot', screenshot)

      const { data } = await api.post('/api/payments', formData)

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

    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-elevated border border-surface-border">

        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">

          <div>

            <h2 className="font-semibold text-slate-900">Book Appointment</h2>

            <p className="text-xs text-slate-500 mt-0.5">Dr. {doctor.name} — {feeLabel}</p>

          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>

        </div>



        <div className="px-6 py-3 flex gap-1">

          {STEPS.map((label, i) => (

            <div key={label} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-primary-600' : 'bg-slate-200'}`} title={label} />

          ))}

        </div>



        <div className="px-6 py-4">

          {error && <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}



          {step === 0 && (

            <div className="space-y-3">

              <p className="text-sm text-slate-500">Step 1: Select consultation type</p>

              {doctor.clinics?.length ? doctor.clinics.map((clinic) => (

                <button

                  key={clinic.id || clinic.clinicName}

                  type="button"

                  onClick={() => { setSelectedClinic(clinic); setStep(1) }}

                  className={`w-full text-left p-4 rounded-xl border transition-colors ${

                    selectedClinic?.clinicName === clinic.clinicName ? 'border-primary-500 bg-primary-50' : 'border-surface-border hover:border-primary-300'

                  }`}

                >

                  <p className="font-medium text-slate-900">{clinic.clinicName}</p>

                  <p className="text-sm text-slate-500">{clinic.address}{clinic.city ? `, ${clinic.city}` : ''}</p>

                  <p className="text-xs text-slate-400 mt-1">{clinic.startTime} – {clinic.endTime}</p>

                </button>

              )) : <p className="text-slate-500 text-sm">No clinics available.</p>}

            </div>

          )}



          {step === 1 && (

            <div className="space-y-4">

              <p className="text-sm text-slate-500">Step 2: Select date and time</p>

              {schedules.length === 0 ? (

                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">

                  No available slots right now. Please check back later.

                </p>

              ) : (

                <>

                  <div className="space-y-2 max-h-48 overflow-y-auto">

                    {schedules.map((s) => (

                      <button

                        key={s.date}

                        type="button"

                        onClick={() => { setSelectedDate(s.date); setSelectedSlot(null) }}

                        className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm ${

                          selectedDate === s.date ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-surface-border'

                        }`}

                      >

                        {new Date(s.date).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'short' })}

                      </button>

                    ))}

                  </div>

                  {selectedDate && (

                    <div className="flex flex-wrap gap-2">

                      {schedules.find((s) => s.date === selectedDate)?.availableSlots?.map((slot) => (

                        <button

                          key={slot}

                          type="button"

                          onClick={() => setSelectedSlot(slot)}

                          className={`px-3 py-1.5 rounded-lg text-sm border font-medium ${

                            selectedSlot === slot ? 'bg-primary-600 text-white border-primary-600' : 'border-surface-border text-slate-700'

                          }`}

                        >

                          {slot}

                        </button>

                      ))}

                    </div>

                  )}

                </>

              )}

              <div className="flex gap-2">

                <Button variant="secondary" size="sm" onClick={() => setStep(0)}>Back</Button>

                <Button size="sm" onClick={() => setStep(2)} disabled={!selectedSlot}>Next</Button>

              </div>

            </div>

          )}



          {step === 2 && (

            <div className="space-y-4">

              <p className="text-sm text-slate-500">Step 3: Confirm booking</p>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm border border-surface-border">

                <p><span className="text-slate-500">Doctor:</span> <span className="font-medium">Dr. {doctor.name}</span></p>

                <p><span className="text-slate-500">Clinic:</span> {selectedClinic?.clinicName}</p>

                <p><span className="text-slate-500">Date:</span> {selectedDate && new Date(selectedDate).toLocaleDateString('en-PK')}</p>

                <p><span className="text-slate-500">Time:</span> {selectedSlot}</p>

                <p><span className="text-slate-500">Fee:</span> <span className="font-bold text-slate-900">{feeLabel}</span></p>

              </div>

              <div className="flex gap-2">

                <Button variant="secondary" size="sm" onClick={() => setStep(1)}>Back</Button>

                <Button size="sm" onClick={bookAppointment} disabled={loading}>

                  {loading ? 'Booking...' : 'Confirm Booking'}

                </Button>

              </div>

            </div>

          )}



          {step === 3 && (

            <div className="space-y-4">

              <p className="text-sm text-slate-500">Step 4: Upload payment screenshot</p>

              <div className="bg-emerald-50 text-emerald-800 text-sm px-4 py-3 rounded-xl border border-emerald-100">

                Appointment booked! Please upload your payment proof ({feeLabel}).

              </div>

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">

                  Payment Screenshot ({feeLabel})

                </label>

                <input

                  type="file"

                  accept="image/*"

                  onChange={(e) => setScreenshot(e.target.files[0])}

                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary-50 file:text-primary-700 file:font-medium"

                />

                {screenshot && <p className="text-xs text-slate-500 mt-1">{screenshot.name}</p>}

              </div>

              <div className="flex gap-2">

                <Button variant="secondary" size="sm" onClick={onClose}>Skip for now</Button>

                <Button size="sm" onClick={uploadPayment} disabled={loading}>

                  {loading ? 'Uploading...' : 'Submit Payment'}

                </Button>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  )

}



export default BookingWizard

